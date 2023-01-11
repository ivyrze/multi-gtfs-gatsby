import React, { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import StopTimeLabel from "./StopTimeLabel";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import _ from "lodash";
import "../styles/accordion.css";
import {
  createAgencyData,
  createRouteData,
  getServiceDays,
  getTripsByServiceDay,
} from "../util";
import RouteListItem from "./RouteListItem";
import ServicePicker from "./ServicePicker";

const AccordionTrigger = React.forwardRef(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className="AccordionHeader">
    <Accordion.Trigger
      className={classNames("AccordionTrigger", className)}
      {...props}
      ref={forwardedRef}
    >
      {children}
      <ChevronDownIcon className="AccordionChevron" aria-hidden />
    </Accordion.Trigger>
  </Accordion.Header>
));

const AccordionContent = React.forwardRef(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Content
    className={classNames("AccordionContent", className)}
    {...props}
    ref={forwardedRef}
  >
    <div className="AccordionContentText">{children}</div>
  </Accordion.Content>
));

const StopTimesHere = ({ times, routes, agency, serviceDays }) => {
  let timesByRoute = _.groupBy(times, "trip.route.routeShortName");

  Object.keys(timesByRoute).forEach((key) => {
    timesByRoute[key] = getTripsByServiceDay(
      timesByRoute[key].map((time) => {
        return { ...time.trip, arrivalTime: time.arrivalTime };
      }),
      serviceDays
    );
  });

  let [service, setService] = useState("weekday");

  return (
    <div>
      <h4>Scheduled stops here</h4>
      <Accordion.Root className="AccordionRoot" type="single" defaultValue={routes[0].routeShortName} collapsible>
        {routes.map((route, idx) => {
          return (
            <Accordion.Item key={route.routeShortName} className="AccordionItem" value={route.routeShortName}>
              <AccordionTrigger>
                <RouteListItem {...route} agency={agency} />
              </AccordionTrigger>
              <AccordionContent>
                <ServicePicker
                  services={timesByRoute[route.routeShortName]}
                  service={service}
                  setService={setService}
                />
                <p>
                  {timesByRoute[route.routeShortName][service].length} {service} trips, arriving
                  here at:
                </p>

                <ul className="columns-4 sm:columns-5 gap-0 border-l-2 border-dotted border-grey-700 text-center">
                  {timesByRoute[route.routeShortName][service].map((trip) => (
                    <li className="border-r-2 border-dotted border-grey-700" key={trip.tripId}>
                      <StopTimeLabel arrivalTime={trip.arrivalTime} />
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );
};

export default StopTimesHere
