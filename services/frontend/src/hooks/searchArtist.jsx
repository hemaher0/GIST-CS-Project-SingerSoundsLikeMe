import apiClient from "../../utils/apiClient";
const PAGE_SIZE = 30;

export const loadSingerOptions = async (search, loadedOptions, { page }) => {
  let res;
  if (search) {
    res = await apiClient.get("/list/artists/search/", {
      params: {
        q: search,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
    });
  } else {
    res = await apiClient.get("/list/artists/", {
      params: {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
    });
  }

  const options = res.data.data.map((a) => ({
    label: a.artist_name,
    value: a.artist_name,
  }));

  return {
    options,
    hasMore: res.data.data.length === PAGE_SIZE,
    additional: {
      page: page + 1,
    },
  };
};
