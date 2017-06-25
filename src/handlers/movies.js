import getProvider, {PROVIDER_TYPE} from '~/api/getProvider.js';

import buildReprompt from '~/lib/buildReprompt.js';
import parseDate from '~/lib/parseDate.js';

import {
  ADD_NOT_FOUND,
  ADD_PROMPT,
  ALREADY_WANTED,
  NO_MOVIE_FOUND,
  NO_MOVIE_SLOT
} from '~/responses/movies.js';

export async function handleFindMovieIntent(req, resp) {
  const movieName = req.slot('movieName');

  if (!movieName) {
    return Promise.resolve(resp.say(NO_MOVIE_SLOT()));
  }

  const api = getProvider(PROVIDER_TYPE.MOVIES);
  let movies = await api.list(movieName);

  if (!movies || !movies.length) {
    const query = buildQuery(req);
    resp.say(NO_MOVIE_FOUND(query));

    movies = await api.search(query);
    if (movies && movies.length) {
      const [topResult] = movies;
      resp
        .say(ADD_PROMPT(topResult.title, topResult.year))
        .session('promptData', buildReprompt(movies, PROVIDER_TYPE.MOVIES))
        .shouldEndSession(false);
    }

    return Promise.resolve(resp);
  }

  const [result] = movies;
  return Promise.resolve(resp.say(ALREADY_WANTED(result.title, result.year)));
}

export async function handleAddMovieIntent(req, resp) {
  const movieName = req.slot('movieName');

  if (!movieName) {
    return Promise.resolve(resp.say(NO_MOVIE_SLOT()));
  }

  const api = getProvider(PROVIDER_TYPE.MOVIES);
  const query = buildQuery(req);
  const movies = await api.search(query);

  if (!movies || !movies.length) {
    resp.say(ADD_NOT_FOUND(movieName));
  }
  else {
    const [topResult] = movies;
    resp
      .say(ADD_PROMPT(topResult.title, topResult.year))
      .session('promptData', buildReprompt(movies, PROVIDER_TYPE.MOVIES))
      .shouldEndSession(false);
  }

  return Promise.resolve(resp);
}

function buildQuery(req) {
  const movieName = req.slot('movieName');
  const releaseDate = parseDate(req.slot('releaseDate'));

  return releaseDate ? `${movieName} ${releaseDate.year}` : movieName;
}
