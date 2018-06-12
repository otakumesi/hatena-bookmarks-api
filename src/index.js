const express = require('express');
const bodyParser = require('body-parser');
const cache = require('memory-cache');
const cors = require('cors');
const VError = require('verror').WError

const dataFns = require('date-fns');
const FeedParser = require('feedparser');

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
    const cached = cache.get(username);
    if (cached != null) {
      return res.json(cached);
    }

    const bookmarks = await fetchBookmarksForThisMonths(username);

    cache.put(username, bookmarks);

    res.json(bookmarks);
  } catch (err) {
    next(new VError(err, "Getting bookmarks has failed."))
  }
});

const fetchBookmarksForThisMonths = (username) => {

};

const fetch BookmarksForDaily = (username, day) => {
  const rss = await fetch(`http://b.hatena.ne.jp/${username}/atomfeed/?date={day}`)
}
