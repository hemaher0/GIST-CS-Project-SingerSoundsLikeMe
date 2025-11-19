import testAudio from "./test.mp3";
export function createTrack({
  title,
  artist,
  popularity = 1,
  album_name = "Unknown Album",
  release_date = "Unknown Date",
  youtubeId = "",
}) {
  return {
    title,
    artist,
    popularity,
    album_name,
    release_date,
    type: "song",
    youtubeId,
  };
}
export function createArtist({
  name,
  id,
  matchCount = 0,
  convertCount = 0,
  image = "",
  gender = "unknown",
  tracks = [], // track 배열
}) {
  return {
    name,
    id,
    matchCount,
    convertCount,
    image,
    gender,
    type: "artist",
    tracks,
  };
}

export function createCover({
  user,
  covered_artist,
  covered_track,
  likes = 0,
  upload_date = new Date().toISOString().split("T")[0],
  audioUrl = "",
}) {
  return {
    covered_by: user,
    covered_artist,
    covered_track,
    likes,
    upload_date,
    type: "cover",
    audioUrl,
  };
}
export function createUser({
  name = "Anonymous",
  image = "https://picsum.photos/80?user",
  followers = 0,
  following = 0,
} = {}) {
  return {
    name,
    image,
    followers,
    following,
    type: "user",
  };
}

export const artistDummy = [
  {
    name: "Taeyeon",
    id: "3qNVuliS40BLgXGxhdBdqu",
    matchCount: 145,
    convertCount: 83,
    image: "https://i.scdn.co/image/ab6761610000e5ebb5d9ebbbbe3fff5a330b40c8",
    gender: "female",
    type: "artist",
  },
  {
    name: "Jimin",
    id: "1oSPZhvZMIrWW5I41kPkkY",
    matchCount: 132,
    convertCount: 64,
    image: "https://i.scdn.co/image/ab6761610000e5ebcb08296cca5a2d197caabb79",
    gender: "male",
    type: "artist",
  },
  {
    name: "Zico",
    id: "4XpUIb8uuNlIWVKmgKZXC0",
    matchCount: 128,
    convertCount: 70,
    image: "https://i.scdn.co/image/ab6761610000e5ebbc333412dcb39d8ef2bd91cc",
    gender: "male",
    type: "artist",
  },
];
export const trackDummy = [
  {
    title: "To. X",
    artist: artistDummy.find((t) => t.name === "Taeyeon"),
    popularity: 1,
    album_name: "To. X - The 5th Mini Album",
    release_date: "2023-11-27",
    type: "song",
    youtubeId: "5_n6t9G2TUQ",
  },
  {
    title: "INVU",
    artist: artistDummy.find((t) => t.name === "Taeyeon"),
    popularity: 1,
    album_name: "INVU - The 3rd Album",
    release_date: "2022-02-14",
    type: "song",
    youtubeId: "AbZH7XWDW_k",
  },
  {
    title: "Fine",
    artist: artistDummy.find((t) => t.name === "Taeyeon"),
    popularity: 1,
    album_name: "My Voice - The 1st Album",
    release_date: "2017-02-28",
    type: "song",
    youtubeId: "BfwvgvCnmRg",
  },
  {
    title: "Who",
    artist: artistDummy.find((t) => t.name === "Jimin"),
    popularity: 1,
    album_name: "MUSE (WONDER ver.)",
    release_date: "2024-07-19",
    type: "song",
    youtubeId: "Av9DvtlJ9_M",
  },
  {
    title: "Like Crazy",
    artist: artistDummy.find((t) => t.name === "Jimin"),
    popularity: 1,
    album_name: "FACE",
    release_date: "2023-03-24",
    type: "song",
    youtubeId: "nOI67IDlNMQ",
  },
  {
    title: "Be Mine",
    artist: artistDummy.find((t) => t.name === "Jimin"),
    popularity: 1,
    album_name: "MUSE",
    release_date: "2024-07-19",
    type: "song",
    youtubeId: "MYrZ5T3jFmA",
  },
  {
    title: "Any song",
    artist: artistDummy.find((t) => t.name === "Zico"),
    popularity: 1,
    album_name: "Any song",
    release_date: "2020-01-13",
    type: "song",
    youtubeId: "UuV2BmJ1p_I",
  },
  {
    title: "actually",
    artist: artistDummy.find((t) => t.name === "Zico"),
    popularity: 1,
    album_name: "THINKING Part.1",
    release_date: "2019-09-30",
    type: "song",
    youtubeId: "SVCnivlXrhg",
  },
];
export const userDummy = [
  createUser({
    name: "Mina Kim",
    image: "https://picsum.photos/80?11",
    followers: 231,
    following: 124,
  }),
  createUser({
    name: "Sumin Lee",
    image: "https://picsum.photos/80?12",
    followers: 512,
    following: 309,
  }),
  createUser({
    name: "Jisoo Park",
    image: "https://picsum.photos/80?13",
    followers: 102,
    following: 200,
  }),
  createUser({
    name: "Taeyoung Choi",
    image: "https://picsum.photos/80?14",
    followers: 87,
    following: 77,
  }),
  createUser({
    name: "Eunwoo Han",
    image: "https://picsum.photos/80?15",
    followers: 645,
    following: 312,
  }),
];

export const coverDummy = [
  createCover({
    user: userDummy[0],
    covered_artist: artistDummy[0],
    covered_track: trackDummy[0],
    likes: 124,
    upload_date: "2023-11-27",
    audioUrl: `${testAudio}?=${userDummy[0].name
      .replace(/\s+/g, "")
      .toLowerCase()}`,
  }),
  createCover({
    user: userDummy[1],
    covered_artist: artistDummy[1],
    covered_track: trackDummy[3],
    likes: 98,
    upload_date: "2023-12-12",
    audioUrl: `${testAudio}?=${userDummy[1].name
      .replace(/\s+/g, "")
      .toLowerCase()}`,
  }),
  createCover({
    user: userDummy[2],
    covered_artist: artistDummy[2],
    covered_track: trackDummy[6],
    likes: 143,
    upload_date: "2024-01-10",
    audioUrl: `${testAudio}?=${userDummy[2].name
      .replace(/\s+/g, "")
      .toLowerCase()}`,
  }),
  createCover({
    user: userDummy[3],
    covered_artist: artistDummy[1],
    covered_track: trackDummy[5],
    likes: 76,
    upload_date: "2024-04-02",
    audioUrl: `${testAudio}?=${userDummy[3].name
      .replace(/\s+/g, "")
      .toLowerCase()}`,
  }),
  createCover({
    user: userDummy[4],
    covered_artist: artistDummy[0],
    covered_track: trackDummy[2],
    likes: 61,
    upload_date: "2023-10-15",
    audioUrl: `${testAudio}?=${userDummy[4].name
      .replace(/\s+/g, "")
      .toLowerCase()}`,
  }),
];

export const favoriteItemsData = [
  {
    id: 1,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBV7l1jMncfr7FF59dK-WL7vvtC6CPB-ZJy5Ox-vvSHCNmJ-4THgnyTEXc1QVn2mXQlcshpOCSBkNKxzyVOQSqxQLMT2_2ASEJ1CeNvWD4qsnd2QfesEbjGQnUOgKwnmhzxMqXbN4-7sLbBy57bC2nxd_kRk5J46FzdIFnqaSvwheTMI2R7ntJqBDSJDxQUnbjxnMdyW7ig30H4pZiRmiKy4DxgIP8a2m7QOhtrSqy6KRnNWjWjhrOh8ER3EleLNRS_OVfGwLHNHXkO",
    title: "Thank U, Next",
    artist: "Ariana Grande",
    percentage: "92%",
  },
  {
    id: 2,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCt5iJW8S1RNCrwrPJIKDyGcZSA2Eo0Kcp0lRO_k2izgcFMR9SxA6og4stQuE-bgW8lxRS_hMkWXYF2eWnzNfDHpF0XHBcbbKiLAyoJGT9wZiRTfatOfDeAL5Q9sHZL7u7LJsuWfXiTmQO7p1LeM53Ry52zM08VJWSCqH8uDfxVR3iFa2JoC5NnxrO2aDECOK_bhwuZmXRU8SeyI8LQzvUIersHQ212YLyPieY9zYju2lqhUc-Yt44y_KMpKgNsxnc9MKY88fG8gnBc",
    title: "Shake It Off",
    artist: "Taylor Swift",
    percentage: "88%",
  },
  {
    id: 3,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDRZE86QQIgt7TgJnzRbyHCoNk8GjffWFm9SAVT7UYZtdmrbFOsDal84rEep7i9-noPu8HXSsSPr8RHNeZBVldCc8V50k9MnoVKFTnqJ__GBTu14g6KLeRZlwsTUdUWDT_rGxVFqPRSsogLyMtdT1QmkecknUCNquFVsu6aA6HGPFrCuu646JOyJi3bB8tvJPrV6rQ_ielXABviiDz-1lQBW-QpPXprZX29VnVTBlw-U8LZx4aG3z0zoP2PpkUHfEsmZGDCHhVeVBUb",
    title: "Halo",
    artist: "Beyonce",
    percentage: "95%",
  },
];

export const historyItemsData = [
  {
    id: 1,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhcavfwXjBSDaTfslmO3gCi7s8K0aq115ohi--6wTjJNMNKOFUIS6vFBieEqeDH9uaMFOKi_o47TbG11TDE5aSQWbJY2dqmL8pDeLgHLNr3yxDPPNwiYvGrwIIoFwRUTY1kyniiMgE74TqytmlNLfvq2gobqI1cOcSUIW900wPjVqsme6wcwI0HFt30MTOlhxKM9Czt4gqthaExRPeGiTQE8hEhG35X6PANUiXr4bMa7V9Ax0TVDUoIXkLXzCQAA0kY-XfIEQ0spYM",
    title: "Your Recording",
  },
  {
    id: 2,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAHrVu-dX08RC2g0rLH-l8U39Ob8mxlQqUI_Q5mhMn0jsgz3B-4wXaZdF5S_wJp5__3Dr30pPCECIs4U0cyGOEAL5GAYylajTakEFViZQ77F3bzOWIAjQNLr87J73hV2Vg9ZtqXjqgAsL3R0P7BsCuuwCw7LE9EU9hf9u8gNzR_uWEpbfSnAbxBf7i3MXi70aGSzVHa0yEuHr9xOYgVnTdUiLcAx7e2nzhFej6WL7YyvewAJ8OGi4cvJmap1NNYj_S1QpJuMhEt9ONb",
    title: "Your Recording",
  },
  {
    id: 3,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9n1nkGwp4itsxA-wUCwK2YrlOJWaFuIGP_AWAmTlLDAU42F3zPfsZhGeSrKN_-dwt9heAKVBxq09ftwXEialUNy5msfbgJZiLG-G43KH2KEkRWsxncC3cakX3Mf5_01xm0MdAoWjpCiAhVu9J-4tkHvbTK6tC_PF7iQcRImHq7EH5QCL82N_1qnSdPPoQJkg_iw2KLmJWU8QlpepU-oI6m9inPvoK1XmaydlbIbvUjs_z2xQTAwv5eIhzGRv4NxsT2wA3MNHQgYyR",
    title: "Your Recording",
  },
];

export const dummyTrending = {
  trending: userDummy, // 사용자 기반 트렌딩
  mostMatched: [...artistDummy].sort((a, b) => b.matchCount - a.matchCount), // 매칭 수 기준 정렬
  mostConverted: [...coverDummy].sort((a, b) => b.likes - a.likes), // 좋아요 수 기준으로 변경
  weeklyPicks: coverDummy, // 커버 기반 주간 추천
};
