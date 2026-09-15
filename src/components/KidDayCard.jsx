import { toISODate } from '../lib/dates.js'
import { resolvePickup } from '../lib/pickup.js'
import { EXCUSE_URL } from '../data/kids.js'

function nextPerson(current, people) {
  if (!current) return people[0] ?? null
  const idx = people.indexOf(current)
  if (idx === -1 || idx === people.length - 1) return null
  return people[idx + 1]
}

export default function KidDayCard({ kid, date, data, store, sameTime = null }) {
  const result = resolvePickup(kid, date, data)
  const dateISO = toISODate(date)

  if (!result) return null

  const { options, chosenKey, time, person, exception } = result
  const timeClass = sameTime === true ? 'kid-time-same' : sameTime === false ? 'kid-time-diff' : ''
  const pin = data.credentials?.[kid.id]?.password
  const regularOpt = options.find((o) => o.key === 'regular')
  const kernzeitOpt = options.find((o) => o.key === 'kernzeit')

  function chooseOption(key) {
    store.setAssignment(dateISO, kid.id, {
      ...(data.assignments[`${dateISO}|${kid.id}`] ?? {}),
      option: key,
    })
  }

  function cyclePerson() {
    store.setAssignment(dateISO, kid.id, {
      ...(data.assignments[`${dateISO}|${kid.id}`] ?? {}),
      person: nextPerson(person, data.people),
    })
  }

  return (
    <div className="kid-card" style={{ '--kid-color': kid.color }}>
      <div className="kid-grid">
        <div className="kid-col kid-col-name">
          <div className="kid-name-row">
            <span className="kid-dot" />
            <span className="kid-name">{kid.name}</span>
          </div>
          <div className="kid-icons-row">
            <a
              className="icon-btn"
              href={EXCUSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Krankmeldung"
            >
              🤒{pin && <span className="icon-btn-pin">{pin}</span>}
            </a>
          </div>
        </div>

        <div className="kid-col kid-col-options">
          {regularOpt && (
            <button
              className={`kid-option-row ${chosenKey === 'regular' ? 'kid-option-active' : ''}`}
              onClick={() => chooseOption('regular')}
            >
              <span>Schulschluss</span>
              <span className="kid-option-time">{regularOpt.time}</span>
            </button>
          )}
          {kernzeitOpt && (
            <button
              className={`kid-option-row ${chosenKey === 'kernzeit' ? 'kid-option-active' : ''}`}
              onClick={() => chooseOption('kernzeit')}
            >
              <span>Kernzeit</span>
              <span className="kid-option-time">{kernzeitOpt.time}</span>
            </button>
          )}
        </div>

        <div className="kid-col kid-col-result">
          <div className={`kid-result-time ${timeClass}`}>
            {time ?? '–'}
            {exception?.time && <span className="badge">Ausnahme</span>}
          </div>
          <button
            className={`kid-person-btn ${person ? '' : 'kid-person-empty'}`}
            onClick={cyclePerson}
          >
            {person ?? 'wer holt?'}
          </button>
        </div>
      </div>
    </div>
  )
}
