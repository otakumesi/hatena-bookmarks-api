const express = require('express');
const bodyParser = require('body-parser');
const cache = require('memory-cache');
const cors = require('cors');
const VError = require('verror').WError;

const startOfMonth = require('date-fns/start_of_month');
const getDaysInMonth = require('date-fns/get_days_in_month');
const getYear = require('date-fns/get_year');
const getMonth = require('date-fns/get_month');
const format = require('date-fns/format');
const isToday = require('date-fns/is_today');

const cheerio = require('cheerio');
const fetch = require('node-fetch');

const app = express()
app.use(cors())
app.use(
  bodyParser.json({
    limit: '1kb'
  })
)

app.get('/v1/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    const bookmarks = await fetchBookmarksForThisMonths(username);

    res.json(bookmarks);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      next(new VError(err, "Getting bookmarks has failed."))
    } else {
      next(new VError(err, err.message))
    }
  }
});

app.use((err, req, res, next) => {
  res.status(500).send({
    error: err.message
  });
});

app.listen(8080, () => {
  console.log('Server start.')
})

const fetchBookmarksForThisMonths = async (username) => {
  dates = getThisMonthDates();
  return Promise.all(
    dates.map((date) => {
      return fetchBookmarksForDaily(username, date);
    })
  );
};

const getThisMonthDates = () => {
  today = new Date();
  dayNumber = getDaysInMonth(today);
  dates = Array.from({length: dayNumber}, (v, k) => k + 1);
  return dates.map((date) => {
    return new Date(getYear(today), getMonth(today), date);
  });
}

const fetchBookmarksForDaily = async (username, date) => {
  formatDate = format(date, 'YYYYMMDD');
  
  let cacheKey = `${username}_${formatDate}`
  let cached = cache.get(cacheKey);
  if (cached != null) {
    return cached;
  }

  let data = await fetch(`http://b.hatena.ne.jp/${username}/atomfeed?date=${formatDate}`);
  const $ = cheerio.load(await data.text(), {xmlMode: true});

  let entries = $('feed').find('entry').map((i, entry) => {
    let sourceURL = $(entry).find('link[rel="related"]').attr('href');
    let bookmarkURL = $(entry).find('link[rel="alternate"]').attr('href');
    return {"sourceURL": sourceURL, "bookmarkURL": bookmarkURL};
  }).get();
  let bookmarkData = {"date": format(date, 'YYYY-MM-DD'), "count": $('feed entry').length, "entries": entries}
  if(!isToday(date)) {
    cache.put(cacheKey, bookmarkData);
  }

  return bookmarkData;
}
