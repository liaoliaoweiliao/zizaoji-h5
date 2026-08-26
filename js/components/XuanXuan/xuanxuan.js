
window.XuanXuan={
 init(){
  if(document.getElementById('xuanxuan')) return;
  let d=document.createElement('div');
  d.id='xuanxuan';
  d.innerHTML='<img id="xuan-img" src="assets/xuanxuan/tantou.png"><div class="xuan-dialog"></div>';
  document.body.appendChild(d);
 },
 show(type,text=''){
  this.init();
  const imgs={
   story:'tantou.png',
   intro:'zhayan.png',
   lab:'tuosaisikao.png',
   workshop:'tuosaisikao.png',
   wood:'bianchengmu.png',
   fire:'bianchenghuo.png',
   wait:'xiaoweibabianchengwenhao.png',
   analysis:'xiaoshujuanjilu.png',
   charcard:'tiaoqilai.png',
   collection:'xueshimao.png'
  };
  document.getElementById('xuan-img').src='assets/xuanxuan/'+imgs[type];
  const box=document.querySelector('.xuan-dialog');
  box.textContent=text;
  box.style.display=text?'block':'none';
 }
};
