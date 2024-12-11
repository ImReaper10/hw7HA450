import React, { Component } from "react";
import * as d3 from "d3";
import FileUpload from "./FileUpload";
import "./App.css"; 

class Child1 extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.state = {
      colorMode: "Sentiment", //default color state
      selectedTweets: [],
      tweets: [], //to hold the parsed data
      layoutComputed: false, // flag to check if layout has been computed
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.colorMode !== this.state.colorMode || (!prevState.layoutComputed && this.state.layoutComputed)) {
      this.createVisualization();
    }
  }

  createVisualization() {
    const { colorMode, tweets, selectedTweets } = this.state;

    const width = 800;
    const height = 800;
    const margin = { top: 100, right: 50, bottom: 50, left: 120 };

    
    d3.select(this.svgRef.current).selectAll("*").remove();

    const svg = d3.select(this.svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);


    const sentimentColorScale = d3.scaleLinear().domain([-1, 0, 1]).range(["red", "#ECECEC", "green"]);

    const subjectivityColorScale = d3.scaleLinear().domain([0, 1]).range(["#ECECEC", "#4467C4"]);

    const colorScales = {
        Sentiment: sentimentColorScale,
        Subjectivity: subjectivityColorScale,
      };
      
    const colorScale = colorScales[colorMode];
      
//============================== Circles for tweets======================================================================

    svg.selectAll("circle").data(tweets.slice(0, 300)).enter().append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 6)
      .attr("fill", (d) => colorScale(d[colorMode]))
      .attr("stroke", (d) => (selectedTweets.find((t) => t.idx === d.idx) ? "black" : "none"))
      .attr("stroke-width", 1.5)
      .on("click", (event, d) => this.TweetClick(d));

//============================== Month labels======================================================================
    const monthRegions = {
      March: height / 5,
      April: height / 2,
      May: (4 * height) / 5,
    };

    svg.selectAll(".month-label").data(Object.keys(monthRegions)).enter().append("text")
      .attr("x", margin.left - 65)
      .attr("y", (month) => monthRegions[month])
      .attr("dy", "0.35em")
      .style("text-anchor", "end")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text((month) => month);

//========================LEGEND ===============================================================
    const legend = svg.append("g").attr("transform", `translate(${width - 100}, 50)`);
    legend
      .append("rect")
      .attr("width", 15)
      .attr("height", 150)
      .style("fill", "url(#gradient)");

      const legendLabels = {
        Sentiment: "Positive",
        Subjectivity: "Subjective",
      };
      
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 10)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(legendLabels[colorMode]);
        const legendLabels2 = {
          Sentiment: "Negative",
          Subjectivity: "Objective",
        };
        
        legend
          .append("text")
          .attr("x", 20)
          .attr("y", 140)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text(legendLabels2[colorMode]);
//========================LEGEND ===============================================================

//==========================Color in legend========================================================================================
    const gradient = svg.append("defs").append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
      const gradientColors1 = { Sentiment: "green", Subjectivity: "#4467C4" };
      
      gradient.append("stop").attr("offset", "0%").attr("stop-color", gradientColors1[colorMode]);
      

      const gradientColors2 = {Sentiment: "#ECECEC",Subjectivity: "#D6E3F8"};
        
      gradient.append("stop").attr("offset", "50%").attr("stop-color", gradientColors2[colorMode]);
      
      const gradientColors3 = {Sentiment: "red",Subjectivity: "#ECECEC"};
      
      gradient.append("stop").attr("offset", "100%").attr("stop-color", gradientColors3[colorMode]);       
        
  }
//============================== Tweet Analysis======================================================================
TweetClick = (tweet) => {
  this.setState((prevState) => {
    // Check if tweet is already clicked from the array
    const isSelected = prevState.selectedTweets.find((t) => t.idx === tweet.idx);

    //check if the circle is clicked on or not 
    const newSelection = isSelected
      ? prevState.selectedTweets.filter((t) => t.idx !== tweet.idx) // Remove the tweet
      : [tweet, ...prevState.selectedTweets]; // Add the tweet

    // Create a Set of IDs for the selected tweets for quick lookup
    const selectedIds = new Set(newSelection.map((t) => t.idx));

    //if its selected then change it to black
    d3.select(this.svgRef.current).selectAll("circle").attr("stroke", (d) => (selectedIds.has(d.idx) ? "black" : "none"));

    // Update the state to store the new selection of tweets
    return { selectedTweets: newSelection };
  });
};


  setTweets = (data) => {
    
    const width = 800;
    const height = 800;

    const monthRegions = {
      March: height / 5,
      April: height / 2,
      May: (4 * height) / 5,
    };

    // Compute layout only once so it doesnt change after new dropdown selection
    const simulation = d3.forceSimulation(data.slice(0, 300))
                         .force("x", d3.forceX(width / 2).strength(0.19)) 
                         .force("y", d3.forceY((d) => monthRegions[d.Month]).strength(1.3))
                         .force("charge", d3.forceManyBody().strength(-15.5)) 
                         .force("collision", d3.forceCollide(7)) 
                         .stop();

    for (let i = 0; i < 300; i++) 
      simulation.tick();

    // Save layout positions in state
    const tweetsWithPosition = data.map((tweet, idx) => ({...tweet, x: simulation.nodes()[idx]?.x || 0, y: simulation.nodes()[idx]?.y || 0,}));

    this.setState({ tweets: tweetsWithPosition, layoutComputed: true });
  };

  render() {
    const { selectedTweets } = this.state;

    return (
      <div className="child1">
        <div className="file-upload">
          <FileUpload set_data={this.setTweets} />
        </div>
        <div className="dropdown">
          <label><strong>Color By:</strong>
            
            <select
              className="color-dropdown"
              onChange={(event) =>
                 // Update the color mode in the state when user selects a different selection
                this.setState({ colorMode: event.target.value })
              }
            >
              <option value="Sentiment">Sentiment</option>
              <option value="Subjectivity">Subjectivity</option>
            </select>
          </label>
        </div>
        <svg ref={this.svgRef}></svg>
        <div className="selected-tweets">
          
          <ul>
            {selectedTweets.map((tweet) => (
              //write the tweet after circle is selected
              <li key={tweet.idx}>{tweet.RawTweet}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default Child1;
