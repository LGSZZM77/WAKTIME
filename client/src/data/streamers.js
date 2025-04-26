const YOUTUBE_BASE = "https://www.youtube.com/@";
const SOOP_BASE = "https://ch.sooplive.co.kr/";
const SOOP_PLAY_BASE = "https://play.sooplive.co.kr/";
const getImage = (name) => require(`./profile_img/${name}.avif`);
const getBanner = (name) => require(`./carousel_img/${name}.avif`);

export const streamers = [
  {
    name: "우왁굳",
    youtube: `${YOUTUBE_BASE}woowakgood`,
    soop: `${SOOP_BASE}ecvhao`,
    soopPlay: `${SOOP_PLAY_BASE}ecvhao`,
    imageUrl: getImage("wakgood"),
    banner: getBanner("wakgood"),
  },
  {
    name: "아이네",
    youtube: `${YOUTUBE_BASE}INE_`,
    soop: `${SOOP_BASE}inehine`,
    soopPlay: `${SOOP_PLAY_BASE}inehine`,
    imageUrl: getImage("ine"),
    banner: getBanner("ine"),
  },
  {
    name: "징버거",
    youtube: `${YOUTUBE_BASE}jingburger`,
    soop: `${SOOP_BASE}jingburger1`,
    soopPlay: `${SOOP_PLAY_BASE}jingburger1`,
    imageUrl: getImage("jingburger"),
    banner: getBanner("burger"),
  },
  {
    name: "릴파",
    youtube: `${YOUTUBE_BASE}lilpa`,
    soop: `${SOOP_BASE}lilpa0309`,
    soopPlay: `${SOOP_PLAY_BASE}lilpa0309`,
    imageUrl: getImage("lilpa"),
    banner: getBanner("lilpa"),
  },
  {
    name: "주르르",
    youtube: `${YOUTUBE_BASE}JU_RURU`,
    soop: `${SOOP_BASE}cotton1217`,
    soopPlay: `${SOOP_PLAY_BASE}cotton1217`,
    imageUrl: getImage("jururu"),
    banner: getBanner("jururu"),
  },
  {
    name: "고세구",
    youtube: `${YOUTUBE_BASE}gosegu`,
    soop: `${SOOP_BASE}gosegu2`,
    soopPlay: `${SOOP_PLAY_BASE}gosegu2`,
    imageUrl: getImage("gosegu"),
    banner: getBanner("segu"),
  },
  {
    name: "비챤",
    youtube: `${YOUTUBE_BASE}viichan116`,
    soop: `${SOOP_BASE}viichan6`,
    soopPlay: `${SOOP_PLAY_BASE}viichan6`,
    imageUrl: getImage("viichan"),
    banner: getBanner("chan"),
  },
];
