const YOUTUBE_BASE = "https://www.youtube.com/@";
const SOOP_BASE = "https://ch.sooplive.co.kr/";
const getImage = (name) => require(`./profile_img/${name}.avif`);

export const streamers = [
  {
    name: "우왁굳",
    youtube: `${YOUTUBE_BASE}woowakgood`,
    soop: `${SOOP_BASE}ecvhao`,
    imageUrl: getImage("wakgood"),
  },
  {
    name: "아이네",
    youtube: `${YOUTUBE_BASE}INE_`,
    soop: `${SOOP_BASE}inehine`,
    imageUrl: getImage("ine"),
  },
  {
    name: "징버거",
    youtube: `${YOUTUBE_BASE}jingburger`,
    soop: `${SOOP_BASE}jingburger1`,
    imageUrl: getImage("jingburger"),
  },
  {
    name: "릴파",
    youtube: `${YOUTUBE_BASE}lilpa`,
    soop: `${SOOP_BASE}lilpa0309`,
    imageUrl: getImage("lilpa"),
  },
  {
    name: "주르르",
    youtube: `${YOUTUBE_BASE}JU_RURU`,
    soop: `${SOOP_BASE}cotton1217`,
    imageUrl: getImage("jururu"),
  },
  {
    name: "고세구",
    youtube: `${YOUTUBE_BASE}gosegu`,
    soop: `${SOOP_BASE}gosegu2`,
    imageUrl: getImage("gosegu"),
  },
  {
    name: "비챤",
    youtube: `${YOUTUBE_BASE}viichan116`,
    soop: `${SOOP_BASE}viichan6`,
    imageUrl: getImage("viichan"),
  },
];
