
const XUAN_LAYOUT={
story:{size:80,right:'6%',bottom:'12%'},
intro:{size:70,right:'8%',bottom:'15%'},
workshop:{size:72,right:'4%',bottom:'14%'},
analysis:{size:78,right:'5%',bottom:'12%'},
charcard:{size:78,right:'5%',bottom:'15%'},
collection:{size:82,right:'3%',bottom:'8%'}
};

function setXuanLayout(page){
 const el=document.querySelector('.xuan-slot');
 if(!el||!XUAN_LAYOUT[page]) return;
 const s=XUAN_LAYOUT[page];
 el.style.width=s.size+'px';
 el.style.right=s.right;
 el.style.bottom=s.bottom;
}
