// Keep embedded portraits small enough for shared tournament storage and backups.
export async function loadPlayerPhoto(file:File):Promise<string> {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photo.');
  if(file.size>10*1024*1024) throw new Error('Please choose a photo smaller than 10 MB.');
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('This photo could not be opened.'));image.src=url;});
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(!ctx) throw new Error('Photo upload is not supported by this browser.');
    for(const size of [256,224,192,160,128]) {
      canvas.width=size;canvas.height=size;
      ctx.fillStyle='#eeeeee';ctx.fillRect(0,0,size,size);
      const crop=Math.min(image.naturalWidth,image.naturalHeight);
      ctx.drawImage(image,(image.naturalWidth-crop)/2,(image.naturalHeight-crop)/2,crop,crop,0,0,size,size);
      for(const quality of [.85,.7,.55,.4]) {
        const photo=canvas.toDataURL('image/jpeg',quality);
        if(photo.startsWith('data:image/jpeg;base64,') && photo.length<=24000) return photo;
      }
    }
    throw new Error('Please try a smaller photo.');
  } finally {URL.revokeObjectURL(url);}
}
