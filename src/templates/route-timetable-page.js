import { graphql } from "gatsby"
import React, { useState } from "react"
import { getServiceDays, getTripsByServiceDay, getTripsByServiceAndDirection, getHeadsignsByDirectionId, formatArrivalTime, sortTripsByFrequentTimepoint } from "../util"
import DirectionPicker from "../components/DirectionPicker"
import ServicePicker from "../components/ServicePicker"
import RouteHeader from "../components/RouteHeader"
import AgencyHeader from "../components/AgencyHeader"
import RouteTimeTable from "../components/RouteTimeTable"

const views = ['List of trips', 'Timetable']

/**
 * Let the user choose how they want to view the timetable.
 * @param {*} view: current value from useState hook 
 * @param {*} setView: setter from useState hook 
 * @returns 
 */
const RouteViewPicker = ({ view, setView }) => {
  return (
    <div className="flex items-center justify-start w-full md:w-auto">
      <span className="bg-gray-300 py-3 text-sm px-12 md:px-4">
        View
      </span>
      <select value={view} onChange={(e) => setView(e.target.value)}>
        {views.map(v => (
          <option value={v} key={v}>{v}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * Tiny testing component for a new route
 * @param {Object} trip: trip element from GraphQL response 
 */
const RouteTimetableTrip = ({ trip }) => {
  return (
    <div style={{ padding: 10, margin: 10, background: '#eee' }}>
      <div className="flex items-center justify-between mb-2">

    <h3 className="m-0">
    to: {trip.tripHeadsign}
    </h3>
    <pre className="block py-1 text-sm m-0 text-gray-500">
      {trip.tripId}
      </pre>
      </div>
      <table>
        <tbody>
          {trip.stopTimes.map(st => (
            <tr key={st.stop.stopId} clas>
              <th className="text-sm text-right">{st.stop.stopName}</th>
              <td className="px-6">{formatArrivalTime(st.arrivalTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}

const RouteTimetable = ({ data, pageContext }) => {

  let route = data.postgres.routes[0]

  let { trips } = route

  let { serviceCalendars } = data.postgres.agencies[0].feedInfo

  let serviceDays = getServiceDays(serviceCalendars)
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays)
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips)
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(trips, serviceDays, headsignsByDirectionId)

  const [direction, setDirection] = useState(Object.keys(headsignsByDirectionId)[0])
  const [service, setService] = useState(Object.keys(tripsByServiceDay)[0])
  const [view, setView] = useState(views[0])

  let selectedTrips = tripsByServiceAndDirection[service][direction]
  let sortedTrips = []
  let timepoints = null
  if (selectedTrips !== undefined && selectedTrips.length > 0) {
    sortedTrips = sortTripsByFrequentTimepoint(selectedTrips).trips
    timepoints = sortTripsByFrequentTimepoint(selectedTrips).timepoints
  }

  return (
    <div>
      <AgencyHeader agency={data.postgres.agencies[0]} />
      <RouteHeader {...route} />
      <div className="flex flex-col w-full md:flex-row items-center justify-start gap-2 my-2">
        <DirectionPicker directions={headsignsByDirectionId} {...{ direction, setDirection }} />
        <ServicePicker services={tripsByServiceDay} {...{ service, setService }} />
        <RouteViewPicker {...{view, setView}} />
      </div>
      {/* {sortedTrips && <h3>There are {sortedTrips.length} trips in that direction of travel on that day.</h3>} */}
      {view === 'List of trips' && sortedTrips.length > 0 && sortedTrips.map(trip => (
        <RouteTimetableTrip trip={trip} key={trip.tripId} />
      ))}
      {view === 'Timetable' && sortedTrips.length > 0 &&
        <RouteTimeTable trips={sortedTrips} timepoints={timepoints} route={route}  />
      }
    </div>
  )
}

export const query = graphql`
  query RouteTimetableQuery($feedIndex: Int, $routeNo: String) {
    postgres {
      routes: routesList(condition: {feedIndex: $feedIndex, routeShortName: $routeNo}) {
        agencyId
        routeShortName
        routeLongName
        routeDesc
        routeType
        routeUrl
        routeColor
        routeTextColor
        routeSortOrder
        feedIndex
        trips: tripsByFeedIndexAndRouteIdList {
          serviceId
          directionId
          tripId
          tripHeadsign
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
            condition: {timepoint: 1}
          ) {
            stop: stopByFeedIndexAndStopId {
              stopName
              stopId
              stopCode
            }
            arrivalTime {
              hours
              minutes
              seconds
            }
          }
        }
      }
      agencies: agenciesList(condition: {feedIndex: $feedIndex}) {
        feedIndex
        agencyName
        feedInfo: feedInfoByFeedIndex {
          serviceCalendars: calendarsByFeedIndexList {
            sunday
            thursday
            tuesday
            wednesday
            monday
            friday
            saturday
            serviceId
          }
        }
      }
    }
  }
`

export default RouteTimetable;