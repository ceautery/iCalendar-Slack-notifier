const ical = require('node-ical')
const fetch = require("node-fetch");

const calendarLocation = process.env.CALENDAR_ADDRESS
const now = new Date()

function post(endpoint, message) {
  fetch(`https://slack.com/api/${endpoint}`, {
    method: 'post',
    headers: {
      authorization: process.env.SLACK_AUTH,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(message)
  })
}

function log(msg) {
  console.log(`${now.toLocaleString()} ${msg}`)
}

function notify(event) {
  const { summary, start, location } = event
  const text = ["Next meeting:", summary, start.toLocaleString(), location].join('\n')
  const message = { channel: 'CD3R11A49', text }

  post('chat.postMessage', message)
  log(`Sent notification for ${summary}`)
}

function firstCurrent(dateList, _default) {
  const filtered = dateList.filter(d => d > now)
    .sort((a,b) => a - b)
  return date = filtered.length ? filtered[0] : _default
}

function setup() {
  ical.parseFile(calendarLocation, (err, data) => {
    const events = Object.values(data)
      .filter(e => e.type == 'VEVENT')

    events.forEach(e => {
      if (e.recurrences) e.start = firstCurrent(Object.keys(e.recurrences).map(r => new Date(r)), e.start)
    })

    const current = events.filter(e => e.start > now)
      .sort((a, b) => a.start - b.start)
    const first = current[0]
    //TODO: Handle all-day events

    if ((first.start - now) < (1000 * 60 * 15)) notify(first)
    else log('No notifications')
  })

}
setup()
