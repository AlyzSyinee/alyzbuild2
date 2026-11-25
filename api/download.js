module.exports=async(req,res)=>{
 const {GITHUB_TOKEN,GITHUB_OWNER,GITHUB_REPO}=process.env,job=req.query.job;
 if(!/^[a-f0-9]{16}$/.test(job||''))return res.status(400).send('Invalid job ID');
 try{
  const h={Authorization:`Bearer ${GITHUB_TOKEN}`,Accept:'application/vnd.github+json'};
  const rel=await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/alyz-${job}`,{headers:h});
  if(!rel.ok)return res.status(404).send('APK release not found yet');
  const release=await rel.json(),asset=release.assets?.find(a=>a.name==='app-release.apk'||a.name==='app-debug.apk');
  if(!asset)return res.status(404).send('APK asset not found');
  const apk=await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/assets/${asset.id}`,{headers:{...h,Accept:'application/octet-stream'}});
  if(!apk.ok)throw new Error('Unable to retrieve APK asset');
  res.setHeader('Content-Type','application/vnd.android.package-archive');res.setHeader('Content-Disposition',`attachment; filename="alyz-${job}.apk"`);
  const data=Buffer.from(await apk.arrayBuffer());res.setHeader('Content-Length',data.length);res.status(200).send(data);
 }catch(e){res.status(500).send(e.message)}
};