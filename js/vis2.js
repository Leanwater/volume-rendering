/**
 * This file contains the code for the second visualization.
 * It is responsible to render a histogram of the volume data.
 *
 * @Author: Kevin Chelappurath
 * @Author: Maximilian Jellen
 */
let svg = null;
let margin = null;
let width = 0;
let height = 0;
let x = null;
let y = null;
let y0 = null;
let yAxis = null;
let yAxis0 = null;
let corner1 = null;
let corner2 = null;
let pinPointsID = 0;
let pinPoints = [];
let selectedPinPoint = null;

/**
 * Class for a pinpoint.
 */
class PinPoint {
    constructor(id, density, intensity, x, y, color) {
        this.id = id;
        this.density = density;
        this.intensity = intensity;
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

/**
 * Creates the histogram.
 */
function histogram() {
    margin = {top: 100, right: 70, bottom: 100, left: 50};

    // Get the size of the container
    let containerWidth = document.getElementById("tfContainer").offsetWidth;
    let containerHeight = document.getElementById("tfContainer").offsetHeight;

    width = containerWidth - margin.left - margin.right;
    height = containerHeight - margin.top - margin.bottom;

    svg = d3.select("#tfContainer")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    y = d3.scalePow()
        .exponent(0.35)
        .range([height, 0]);

    y0 = d3.scaleLinear()
        .range([height, height / 2])
        .domain([0, 1]);

    yAxis = svg.append("g");
    yAxis0 = svg.append("g");

    document.getElementById("tfContainer").addEventListener("click", checkClick);

    createDefaultPinPoint();
}

/**
 * Updates the histogram.
 */
function update() {
    svg.append("g")
        .attr("transform", `translate(0, ${height / 2})`)
        .call(d3.axisBottom(x));

    svg.append("text")
        .style("fill", "white")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height / 2 + 35)
        .text("density");

    svg.append("text")
        .style("fill", "white")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -50)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("intensity");

    let data = Array.from(volume.voxels);

    // Adjust the thresholds based on your data distribution
    let histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(d3.range(0, 1.01, 0.01));

    let bins = histogram(data);
    let max = d3.max(bins, d => d.length);

    y.domain([-max, max]);

    yAxis0
        .call(d3.axisLeft(y0))
        .attr("transform", `translate(0, ${-height / 2})`);

    // Shows the density values
    let tooltip = d3.select("#tooltip");

    // Join the rect with the bins data
    svg.selectAll("rect")
        .data(bins)
        .join("rect") // Add a new rect for each new elements
        .on('mouseover', function (event, d) {
            tooltip
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .style("background-color", "black")
                .style("color", "white")
                .style("padding", "5px")
                .html(d.length);
        })
        .on('mouseout', function () {
            tooltip
                .style("opacity", 0);
        })
        .transition() // and apply changes to all of them
        .duration(1000)
        .attr("x", 1)
        .attr("transform", function (d) {
            return `translate(${x(d.x0)}, ${y(0)})`
        })
        .attr("width", function (d) {
            return Math.max(0, x(d.x1) - x(d.x0) - 1);
        })
        .attr("height", function (d) {
            return height / 2 - (y(d.length));
        })
        .style("fill", "#ffffff")
        .style("opacity", "0.4");

    corner1 = {x: x(0), y: height / 2};
    corner2 = {x: x(1), y: 0};
}

/**
 * Creates a default pinpoint.
 */
function createDefaultPinPoint() {
    let defaultPinPoint = new PinPoint(pinPointsID++, 0.3, 1.0, x(0.3), y0(1.0), "#ffffff");
    pinPoints = [defaultPinPoint];
    createPinPoints(pinPoints);
}

/**
 * Creates the pinpoints.
 * @param pinPoints
 */
function createPinPoints(pinPoints) {
    // Remove all pinpoints
    svg.selectAll(".line, .dot").remove();

    // Create new pinpoints
    svg.selectAll(".line")
        .data(pinPoints)
        .join("line")
        .attr("class", "line")
        .attr("id", d => "line" + d.id)
        .attr("x1", d => d.x)
        .attr("y1", height / 2)
        .attr("x2", d => d.x)
        .attr("y2", d => d.y - height / 2)

    svg.selectAll(".dot")
        .data(pinPoints)
        .join("circle")
        .attr("class", "dot")
        .attr("id", d => "dot" + d.id)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y - height / 2)
        .attr("r", 6)
        .attr("fill", d => d.color)
        .on("click", clickDot)
        .call(d3.drag()
            .subject(d3.select(this))
            .on("start", function (event, d) {
                if (selectedPinPoint) {
                    d3.select("#dot" + selectedPinPoint.id)
                        .attr("stroke", "white");
                }

                d3.select(this)
                    .raise()
                    .attr("stroke", "gold");
                setSelectedPinPoint(d, this);
            })
            .on("drag", function (event, d) {
                requestAnimationFrame(paint);
                d3.select(this)
                    .attr("cx", d.x = Math.max(corner1.x, Math.min(corner2.x, event.x)))
                    .attr("cy", d.y = Math.min(corner1.y, Math.max(corner2.y, event.y)));

                d3.select("#line" + selectedPinPoint.id)
                    .attr("x1", d.x)
                    .attr("x2", d.x)
                    .attr("y2", d.y);

                d.y = d.y + height / 2;

                //update the density/intensity values
                d.density = x.invert(d.x);
                d.intensity = y0.invert(d.y);
            })
            .on("end", function () {
                requestAnimationFrame(paint);
            }));

    /**
     * Handles the click on a pinpoint.
     * @param event
     * @param d
     */
    function clickDot(event, d) {
        // remove control point
        if (event.shiftKey) {
            let index = pinPoints.indexOf(d);
            pinPoints.splice(index, 1);

            createPinPoints(pinPoints);
            requestAnimationFrame(paint);
        }
        // change color
        else {
            let colorPicker = d3.select("#colorPicker")
                .style("left", event.clientX + "px")
                .style("top", event.clientY + "px");

            let colorPickerNode = colorPicker.node();

            colorPickerNode.value = d.color;
            colorPickerNode.focus();
            colorPickerNode.click();

            colorPickerNode.addEventListener('change', function (event) {
                setColorSelected(event, d);
            });
        }

        setSelectedPinPoint(d, this);
    }

    /**
     * Sets the color of a pinpoint.
     * @param event
     */
    function setColorSelected(event) {
        if (selectedPinPoint) {
            let color = event.target.value;
            selectedPinPoint.color = color;
            d3.select("#dot" + selectedPinPoint.id).attr("fill", color);
            d3.select("#colorPicker");

            requestAnimationFrame(paint);
        }
    }
}

/**
 * Checks if a click on the histogram happened.
 * @param event
 */
function checkClick(event) {
    let data = pinPoints;

    // add control point
    if (event.ctrlKey) {
        let p = {
            x: x.invert(event.offsetX - margin.left), y: y0.invert(event.offsetY - margin.top + height / 2)
        };

        if (p.x > 1 || p.x < 0 || p.y > 1 || p.y < 0) {
            return;
        }

        let index = data.length;
        for (let i = 0; i < data.length; i++) {
            if (data[i].density > p.x) {
                index = i;
                break;
            }
        }

        let pinPoint = new PinPoint(pinPointsID++, p.x, p.y, x(p.x), y0(p.y), "#ffffff");

        data.splice(index, 0, pinPoint);

        createPinPoints(data);
        pinPoints = data;
        requestAnimationFrame(paint);
    }
}

/**
 * Sets the selected pinpoint.
 * @param point
 * @param element
 */
function setSelectedPinPoint(point, element) {
    selectedPinPoint = point;

    d3.select(element).raise()
        .attr("stroke", "gold")
        .attr("fill", () => point.color);
}

/**
 * Returns the pinpoints.
 *
 */
function getPinPoints() {
    return pinPoints;
}