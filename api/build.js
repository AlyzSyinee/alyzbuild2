const crypto = require('crypto');
const GH='https://api.github.com';
const headers=()=>({Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
const json=(status,obj)=>({status,headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});
module.exports=async function(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const {GITHUB_TOKEN,GITHUB_OWNER,GITHUB_REPO}=process.env;
 if(!GITHUB_TOKEN||!GITHUB_OWNER||!GITHUB_REPO)return res.status(500).json({error:'Server configuration missing: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO'});
 try{
  const {platform,filename,file}=req.body||{};
  if(!['flutter','html'].includes(platform)||!filename||!file)return res.status(400).json({error:'Invalid build payload'});
  if(!/\.zip$/i.test(filename)&&!(platform==='html'&&/\.html?$/i.test(filename)))return res.status(400).json({error:'Unsupported file type'});
  const buffer=Buffer.from(file,'base64');if(!buffer.length||buffer.length>45*1024*1024)return res.status(413).json({error:'File is empty or exceeds 45 MB'});
  if(platform==='flutter'&&!filename.toLowerCase().endsWith('.zip'))return res.status(400).json({error:'Flutter project must be a ZIP archive'});
  const jobId=crypto.randomUUID().replace(/-/g,'').slice(0,16), branch='alyz-'+jobId;
  const api=`${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, h=headers();
  const call=async(url,method='GET',body)=>{const r=await fetch(url,{method,headers:{...h,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||`GitHub API error ${r.status}`);return d};
  const base=await call(`${api}/git/ref/heads/${process.env.GITHUB_BASE_BRANCH||'main'}`);
  const blob=await call(`${api}/git/blobs`,'POST',{content:buffer.toString('base64'),encoding:'base64'});
  const tree=await call(`${api}/git/trees`,'POST',{base_tree:base.object.sha,tree:[{path:`jobs/${jobId}/source${filename.toLowerCase().endsWith('.zip')?'.zip':'.html'}`,mode:'100644',type:'blob',sha:blob.sha}]});
  const commit=await call(`${api}/git/commits`,'POST',{message:`ALYZ build source ${jobId}`,tree:tree.sha,parents:[base.object.sha]});
  await call(`${api}/git/refs`,'POST',{ref:`refs/heads/${branch}`,sha:commit.sha});
  await call(`${api}/actions/workflows/build.yml/dispatches`,'POST',{ref:branch,inputs:{platform,job_id:jobId,source_path:`jobs/${jobId}/source${filename.toLowerCase().endsWith('.zip')?'.zip':'.html'}`}});
  res.status(202).json({jobId,branch,status:'queued'});
 }catch(e){res.status(500).json({error:e.message||'Unable to start build'})}
};