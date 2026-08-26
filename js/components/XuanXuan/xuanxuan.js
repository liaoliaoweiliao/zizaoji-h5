window.XuanXuan={
 init(){
  if(document.getElementById('xuanxuan')) return;
  let d=document.createElement('div');
  d.id='xuanxuan';
  d.innerHTML='<img id="xuan-img" src="assets/xuanxuan/tantou.png"><div class="xuan-dialog"></div>';
  // 挂到 #app 内，使玄玄定位相对应用列（移动端=视口，桌面端=居中的应用列），避免桌面端飘到视口边缘
  const host = document.getElementById('app') || document.body;
  host.appendChild(d);
 },
 show(type,text=''){
  this.init();

  const imgs={
   story:'tantou.png',
   intro:'zhayan.png',
   lab:'tuosaisikao.png',
   workshop:'tuosaisikao.png',
   analysis:'xiaoshujuanjilu.png',
   charcard:'zhayan.png',
   collection:'xueshimao.png'
  };

  const page=type;
  const el=document.getElementById('xuanxuan');
  el.className='xuan-'+page;

  // 造字人格、海报页面不显示玄玄
  if(page==='personality'||page==='poster'){
    el.style.display='none';
    return;
  }else{
    el.style.display='block';
  }

  document.getElementById('xuan-img').src='assets/xuanxuan/'+(imgs[type]||'zhayan.png');
  const box=document.querySelector('.xuan-dialog');
  box.textContent=text;
  box.style.display=text?'block':'none';
 }
};
