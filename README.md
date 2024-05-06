# D3 Dashboard Widgets
The D3 visualization library is a great "swiss army knife" library; it's very utilitarian and therefore brings little bias of its own. Therefor, where using D3 to create custom dashboards, each project must decide for itself how it wishes to handle the business logic of transforming the data into a dashboard. This repository lays out a design pattern for handling this, and examples of how that pattern can be useful.

# Mondrian pattern
A dashboard display typically has multiple different visualizations on it, showing different sorts of data. But often those visualizations share a common dimensional axis (e.g. a timeline chart with multiple "swimlanes" of categorical data). These subsections thus need a way to communicate how much layout space they need in the other dimensions, and share axis information (if the user pans/zooms, updating all the subsections). The design pattern defined here is named Mondrian after [Piet Mondrian](https://www.theartstory.org/artist/mondrian-piet/); an artist known for artworks of [blocks of color](https://www.thehistoryofart.org/piet-mondrian/composition-a/) that lay out in interesting ways.

## Controller
A bridge between the React world and the D3 world. It is responsible for adding the initial state of the visualization to the DOM and triggering lifecycle events to the Painter modules.

### Zone
Term used for a subsection of the visualization that has separate logic to define how it appears. The Controller defines what Zones are in the visualization and binds a Painter to each Zone.

## Painter
Respond to chart events from the Controller. Painter modules are basic JavaScript classes, that have defined properties that are event handlers to respond to different lifecycle events.

## Lifecycle
- **Controller Render** As a React class, the Controller should have the SVG node in its return value, and use a [`useRef`](https://react.dev/reference/react/useRef) hook to hold a reference to it.
- **Controller Initialize** Once the SVG node is added to the DOM, the Controller handles the initial paint of the visualization. This typically includes the Controller drawing the shared components of the visualization (any borders, legends, and axis that are shared) and defining the shared D3 scales.
- **Zone Initialization** Each zone gets initialized by triggering the `init` function on the Painter bound to it. This function is called when the visualization may not be ready in the DOM; it does not receive the zone DOM container as an argument. The intention at this lifecycle stage is to fetch data needed for the current view. This handler returns a Promise, so the Controller can pause until all zones are done initializing.
- **Zone Bounds** The Controller creates a container element for each zone. The Painter methods of `getHeight` and `getWidth` can be used by the Controller to figure out how to lay out the container elements in this phase.
- **Zone Paint** The Controller triggers the `paintData` method on each zone's Painter to complete the visualization.

This lifecycle can repeat if the user interacts with the visualization (e.g. pans or zooms the chart, changes data filters). Hence each of the lifecycle handlers for both the Controller and Painter modules should assume they could be called repeatedly. Notably, the "Initialize" handlers shouldn't just blindly add elements to the canvas but should to D3 "join" actions (otherwise subsequent loops through the lifecycle stages would end up adding more elements to the canvas, rather than updating the existing). This is not essential if the visualization has no user interactions that change the layout of the visualization (e.g. if the visualization only has tooltips that get drawn on top of the static visualization on mouse hover). The Controller, as the coordinator of the lifecycle events is the one that listens to user mouse interactions, and then triggers the appropriate reactions.

## Dev environment
```bash
npm install
docker-compose up
```
