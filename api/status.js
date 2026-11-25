const GH='https://api.github.com';
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const {GITHUB_TOKEN,GITHUB_OWNER,GITHUB_REPO}=process.env,job=req.query.job;
 if(!GITHUB_TOKEN||!GITHUB_OWNER||!GITHUB_REPO)return res.status(500).json({error:'GitHub environment variables are missing'});
 if(!/^[a-f0-9]{16}$/.test(job||''))return res.status(400).json({error:'Invalid job ID'});
 try{
  const r=await fetch(`${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?branch=alyz-${job}&per_page=1`,{headers:{Authorization:`Bearer ${GITHUB_TOKEN}`,Accept:'application/vnd.github+json'}});
  const d=await r.json();if(!r.ok)throw new Error(d.message||'GitHub status lookup failed');
  const run=d.workflow_runs?.[0];if(!run)return res.status(200).json({status:'queued',logs:['Waiting for GitHub Actions runner...']});
  const status=run.status==='completed'?(run.conclusion==='success'?'success':run.conclusion==='cancelled'?'cancelled':'failure'):run.status==='in_progress'?'building':'queued';
  let message='';
  if(status==='failure')message='Build failed. Open the GitHub Actions run for the exact compiler error.';
  res.status(200).json({status,message,logs:[`Workflow state: ${run.status}${run.conclusion?' / '+run.conclusion:''}`,`Run: ${run.html_url}`]});
 }catch(e){res.status(500).json({error:e.message})}
};