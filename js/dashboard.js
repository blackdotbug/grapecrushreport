var legendParent = d3.select("#legendParent").node()

var legend = d3.select("#legendParent").append("svg")
    .attr("width", legendParent.clientWidth - 20)
    .attr("height", legendParent.clientHeight)
    .attr("transform", "translate(0,-2)")
    .append("g")
    .attr("class", 'legend districts')
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle");

legend.append("text")
    .text("All Districts")
    .attr("font-weight", "bold")
    .attr("transform", "translate(30,13)")
    .attr("class", "allDistricts")
    .attr("style", "cursor:pointer")
    .on("click", allDistrictsClick);

// initialize tooltip
var tooltip = d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .attr('style', 'position: absolute; opacity: 0;');
var districtColors = ["#557c5eff", "#e4de9fff", "#f7b32bff", "#f72c25ff", "#8f7d91ff", "#8b604cff", "#bacba9ff", "#717568ff", "#c25b02ff", "#20a39eff", "#3d5a80ff", "#5adbffff", "#13315cff", "#75485eff", "#028090ff", "#b3001bff", "#ba0696ff", "#a2682cff"];

var color = d3.scaleOrdinal()
    .range(districtColors);

// BUILD CALIFORNIA MAP
var w = 250;
var h = 300;

//Define map projection
var projection = d3.geoMercator()
                       .center([ -120, 37 ])
                       .translate([ (w/2)-15, h/2+20 ])
                       .scale([ w*5 ]);

//Define path generator
var path = d3.geoPath()
                 .projection(projection);

//Create SVG
var map = d3.select("#map")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

d3.csv("./data/districts.csv", d3.autoType).then(function(districts){
    d3.json("./data/california_counties.geojson").then(function(json) {
        json = json.features;

        dists = [... new Set(districts.map(d => d.district))];
        color.domain(dists);

        json.forEach(function(county){
            var match = districts.filter(d => d.county === county.properties.namelsad);
            if (match.length > 1) {
                var ds = {}
                match.forEach(function(m){
                    ds[m.district] = m.detail;
                });
                county.properties['district'] = ds;
            }
            else if (match.length === 1){
                county.properties['district'] = match[0].district;
            }
        });

        var t1112 = textures.lines()
            .orientation("6/8")
            .size(7)
            .strokeWidth(3)
            .stroke(color("dist11"))
            .background(color("dist12"));

        map.call(t1112);

        var t1314a = textures.lines()
        .orientation("6/8")
        .size(7)
        .strokeWidth(3)
        .stroke(color("dist13"))
            .background(color("dist14"));

        map.call(t1314a);

        var t1314b = textures.lines()
        .orientation("6/8")
        .size(7)
        .strokeWidth(3)
        .stroke(color("dist14"))
            .background(color("dist13"));

        map.call(t1314b);

        var t0917 = textures.lines()
            .orientation("6/8")
            .size(7)
            .strokeWidth(3)
            .stroke(color("dist09"))
            .background(color("dist17"));

        map.call(t0917);
        
        var tDefault = textures.lines()
            .orientation("6/8")
            .size(7)
            .strokeWidth(3)
            .stroke(color("dist11"))
            .background(color("dist09"));

        map.call(tDefault);

        map.append('g')
            .attr('id', 'mapPaths')
            .selectAll("path")
            .data(json)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", d => mapPattern(d.properties))
            .on('mouseover', function(d) {
                mapDetails(d.properties);
                return d3.select(this).style("stroke-width", "2px");
            })
            .on('mouseout', function(){ 
                d3.select('#mapDetails').html("");
                return d3.select(this).style("stroke-width", "1px");
            });
            
        function mapDetails(properties) {
            var details = d3.select('#mapDetails');
            details.html("");
            details.append("p")
                .html(properties.namelsad);
            if (typeof(properties.district) === 'string'){
                details.append("p")
                    .attr('class', 'entries')
                    .html("<b>District "+properties.district.slice(-2)+"</b>");
            }
            else {
                var entries = Object.entries(properties.district); 
                details.selectAll('.entries')
                    .data(entries)
                    .enter()
                    .append('p')
                    .attr('class', 'entries')
                    .html(d => "<b>District "+d[0].slice(-2) + "</b> " + d[1]);
            }
        }

        function mapPattern(properties) {
            if (typeof(properties.district) == 'string'){
                return color(properties.district);
            }
            else {
                console.log(properties);
                var fillPattern;
                if (properties.name === "Kings"){
                    fillPattern = t1314a.url();
                }
                else if (properties.name === "Yolo"){
                    fillPattern = t0917.url();
                }
                else if (properties.name === "San Joaquin"){
                    fillPattern = t1112.url();
                }
                else if (properties.name === "Tulare"){
                    fillPattern = t1314b.url();
                }
                else {
                    fillPattern = tDefault.url();
                }
                console.log(fillPattern);
                return fillPattern;
            }
        }
            
    });
});


function getData(shape){
    var data;
    if (shape === 'wide'){
        data = d3.csv("./data/gcr2019aggWide2.csv", function(d, index, columns) {
            if (d.level_2 === 'tons'){
                for (i = 3; i < columns.length; ++i) d[columns[i]] = +d[columns[i]];
                for (i2 = 3, t = 0; i2 < columns.length; ++i2) t += d[columns[i2]];
                d.total_tons = t;
                d.aveBrixAll = 0;
                d.aveBaseAll = 0;
            }
            else if (d.level_2 === 'brixfactor'){
                for (i = 3; i < columns.length; ++i) d[columns[i]] = +d[columns[i]];
                for (i2 = 3, t = 0, q = 0; i2 < columns.length; ++i2) {
                    t += d[columns[i2]];
                    if (d[columns[i2]] > 0) { ++q; }
                }
                d.total_tons = 0;
                d.aveBrixAll = t/q;
                d.aveBaseAll = 0;
            }
            else {
                for (i = 3; i < columns.length; ++i) d[columns[i]] = +d[columns[i]];
                for (i2 = 3, t = 0, q = 0; i2 < columns.length; ++i2) {
                    t += d[columns[i2]];
                    if (d[columns[i2]] > 0) { ++q; }
                }
                d.total_tons = 0;
                d.aveBrixAll = 0;
                d.aveBaseAll = t/q;
            }
            return d;
        });
    }
    else {
        data = d3.csv("./data/gcr2019avesTall2.csv", d3.autoType);        
    }
    return data;
} 

// build menu options
getData('tall').then(function(data){
    var optionText = [... new Set(data.map(d => d.district))];
    color.domain(optionText);

    var options = legend.selectAll(".option")
        .data(optionText)
        .enter().append("g")
        .attr("transform", (d, i) => "translate(" + (80 + i * 20) + ",0)");

    options.append("rect")
        .attr("x", -19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color)
        .attr("style", "cursor:pointer")
        .attr("class", "option")
        .attr("id", d => d)
        .style("pointer-events", "visible")
        .on("click", districtClick);

    options.append("text")
        .attr("x", -10)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .attr("fill", "#fff")
        .attr("style", "cursor:pointer")
        .attr("class", "option")
        .attr("id", d => d)
        .text((d, i) => i+1)
        .style("pointer-events", "visible")
        .on("click", districtClick);

})

function getDims(id, svgWidth, svgHeight, length) {

    if (id === "#graphRev") {
        var margin = {
            top: 10,
            right: 50,
            bottom: 20,
            left: 65
        };
    }
    else {
        svgHeight = 50 + length * 15;

        var margin = {
            top: 24,
            right: 14,
            bottom: 40,
            left: 130
        };
    }
    
    var width = svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;

    return {svg: {height: svgHeight, width: svgWidth}, 
            margin: margin,
            chart: {height: height, width: width}};
}

function buildGraph(id, shape, geo, features, label, filter="", districtValue="allDistricts", typeValue="allTypes") {
    getData(shape).then(function(dataset){
        var keys = dataset.columns.slice(3);
        
        var parent = d3.select(id).node();
        
        if (shape === 'wide'){
            dataset = dataset.filter(d => d[features.x.col] > 0);
            if (districtValue === "allDistricts" && filter != "wt_ave_base") {
                if(typeValue != "allTypes") {
                    dataset = dataset.filter(d => d.type === typeValue);
                }
                if(features.sort.dir === "desc"){
                    dataset.sort((a, b) => a[features.sort.col] - b[features.sort.col]);
                }
                if(features.sort.dir === "asc"){
                    dataset.sort((a, b) => b[features.sort.col] - a[features.sort.col]);            
                }

                var dims = getDims(id, parent.clientWidth, parent.clientHeight, dataset.length);
            
                var svg = d3.select(id)
                    .append("svg")
                    .attr("width", dims.svg.width)
                    .attr("height", dims.svg.height);
        
                var chart = svg.append("g")
                    .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);
    
                var y = d3.scaleBand()
                    .range([dims.chart.height, 0])
                    .padding(0.1)
                    .domain(dataset.map(d => d[features.y.col]));					
        
                var x = d3.scaleLinear()
                    .range([0, dims.chart.width])
                    .domain([0, d3.max(dataset, d => d[features.x.col])]).nice();
            
                chart.append("g")
                    .attr('class', geo.tag)
                    .selectAll("g")
                    .data(d3.stack().keys(keys)(dataset))
                    .enter().append("g")
                    .attr("fill", d => color(d.key))
                    .attr("class", d => d.key)
                    .selectAll(geo.tag)
                    .data(d => d)
                    .enter().append(geo.tag)
                    .attr("y", d => y(d.data[features.y.col]))
                    .attr("x", d => x(d[0]))
                    .attr("width", d => x(d[1]) - x(d[0]))
                    .attr("height", y.bandwidth())
                    .on('mouseover', function(d) {
                        var gClass = d3.select(this.parentNode).attr('class')
                        d3.select('#tooltip').transition().duration(200).style('opacity', 1);
                        d3.select('#tooltip').html("<p>District "+gClass.slice(-2)+"</p><p>"+d.data.variety+"</p><p>"+d3.format(".3s")(d.data[gClass])+" tons</p>");
                        })
                    .on('mouseout', function() {
                        d3.select('#tooltip').style('opacity', 0)
                        })
                    .on('mousemove', function() {
                        d3.select('#tooltip').style('left', (d3.event.pageX+15) + 'px').style('top', (d3.event.pageY-35) + 'px')
                        });
            }
            else {
                if (filter) {
                    if (filter === "wt_ave_base" || filter === "brixfactor" || filter === "tons") {
                        dataset = dataset.filter(d => d.level_2 == filter); 
                    }
                }
                if (typeValue != "allTypes") {
                    dataset = dataset.filter(d => d.type === typeValue);
                }
                if(features.sort.dir === "desc"){
                    dataset.sort((a, b) => a[features.sort.col] - b[features.sort.col]);
                }
                if(features.sort.dir === "asc"){
                    dataset.sort((a, b) => b[features.sort.col] - a[features.sort.col]);            
                }

                var dims = getDims(id, parent.clientWidth, parent.clientHeight, dataset.length);
        
                var svg = d3.select(id)
                    .append("svg")
                    .attr("width", dims.svg.width)
                    .attr("height", dims.svg.height);
        
                var chart = svg.append("g")
                    .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);

                var y = d3.scaleBand()
                    .range([dims.chart.height, 0])
                    .padding(0.1)
                    .domain(dataset.map(d => d[features.y.col]));					
        
                var x = d3.scaleLinear()
                    .range([0, dims.chart.width])
                    .domain([0, d3.max(dataset, d => d[features.x.col])]).nice();

                chart.append("g")
                    .attr('class', geo.class)
                    .selectAll(geo.tag)
                    .data(dataset)
                    .enter().append(geo.tag)
                    .attr("y", d => y(d[features.y.col]))
                    .attr("x", 0)
                    .attr("fill", color(features.color))
                    .attr("width", d => x(d[features.x.col]))
                    .attr("height", y.bandwidth())
                    .on('mouseover', function(d) {
                        d3.select('#tooltip').transition().duration(200).style('opacity', 1);
                        d3.select('#tooltip').html("<p>"+d.variety+"</p><p>Ave Base All Districts: $"+d3.format("$,.0f")(d.aveBaseAll)+"</p>");
                        })
                    .on('mouseout', function() {
                        d3.select('#tooltip').style('opacity', 0)
                        })
                    .on('mousemove', function() {
                        d3.select('#tooltip').style('left', (d3.event.pageX+15) + 'px').style('top', (d3.event.pageY-35) + 'px')
                        });
            }    

            chart.append("g")
                .attr("class", "axis axisLeft")
                .attr("transform", "translate(0,0)")
                .call(d3.axisLeft(y));

            chart.append("g")
                .attr("class", "axis axisTop")
                .attr("transform", "translate(0,0)")
                .call(d3.axisTop(x).ticks(null, "s"))

            chart.append("g")
                .attr("class", "axis axisBottom")
                .attr("transform", "translate(0,"+dims.chart.height+")")
                .call(d3.axisBottom(x).ticks(null, "s"))
                .append("text")
                .attr("y", 2)
                .attr("x", x(x.ticks().pop()) + 0.5)
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "start")
                .text(label)
                .attr("transform", "translate(-20,-10)");
    
    
        }
        else {
            if (geo.tag === "circle") {
                if (districtValue != "allDistricts") {
                    dataset = dataset.filter(d => d.district === districtValue)
                }
                if (typeValue != "allTypes") {
                    dataset = dataset.filter(d => d.type === typeValue);
                }
                dataset = dataset.filter(d => d[features.x.col] > 0 && d[features.y.col] > 0)

                var dims = getDims(id, parent.clientWidth, parent.clientHeight, dataset.length);
            
                var svg = d3.select(id)
                    .append("svg")
                    .attr("width", dims.svg.width)
                    .attr("height", dims.svg.height);
        
                var chart = svg.append("g")
                    .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);
        
                var y = d3.scaleLinear()
                    .range([dims.chart.height, 0])
                    .domain([0, d3.max(dataset, d => d[features.y.col])]).nice();

                var x = d3.scaleLinear()
                    .range([0, dims.chart.width])
                    .domain([0, d3.max(dataset, d => d[features.x.col])]).nice();
        
                var r = d3.scaleLinear()
                    .domain(d3.extent(dataset, d => d[features.r.col]))
                    .range([4,18]);
                    
                chart.append('g')
                    .selectAll("dot")
                    .data(dataset)
                    .enter()
                    .append("circle")
                    .attr("cx", d => x(d[features.x.col]) + 4)
                    .attr("cy", d => y(d[features.y.col]))
                    .attr("r", d => r(d[features.r.col]))
                    .style("fill", d => color(d[features.color]))
                    .style("opacity", "0.6")
                    .attr("class", d => d.district)
                    .attr("stroke", "white")
                    .style("stroke-width", "2px")
                    .on('mouseover', function(d) {
                        var gClass = d3.select(this).attr('class')
                        d3.select('#tooltip').transition().duration(200).style('opacity', 1);
                        d3.select('#tooltip').html("<p>District "+gClass.slice(-2)+"</p><p>"+d.variety+"</p><p>Ave Base: $"+d.wt_ave_base+"</p><p>Tons: "+d3.format(".3s")(d.tons)+"</p><p>Revenue: "+d3.format("$,.2f")(d.revenue)+"</p><p>Brix Factor: "+d3.format(".0f")(d.brixfactor)+"</p>");
                        })
                    .on('mouseout', function() {
                        d3.select('#tooltip').style('opacity', 0)
                        })
                    .on('mousemove', function() {
                        d3.select('#tooltip').style('left', (d3.event.pageX+15) + 'px').style('top', (d3.event.pageY-35) + 'px')
                        });

                chart.append("g")
                .attr("class", "legendSize")
                .attr("transform", "translate("+ (dims.chart.width - 100) +", 10)");
              
              var legendSize = d3.legendSize()
                .scale(r)
                .shape('circle')
                .shapePadding(15)
                .labelOffset(12)
                .orient('horizontal')
                .title('Tons')
                .cells([1, d3.max(dataset, d=>d[features.r.col])/2, d3.max(dataset, d=>d[features.r.col])])
                .labelFormat(d3.format(",.0s"));
              
              chart.select(".legendSize")
                .call(legendSize);
        
                chart.append("g")
                    .attr("class", "axis axisLeft")
                    .attr("transform", "translate(0,0)")
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr("y", y(y.ticks().pop()) + 0.5)
                    .attr("x", 2)
                    .attr("dy", "0.32em")
                    .attr("fill", "#000")
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .text("Brix Factor")
                    .attr("transform", "translate(2,0)");

                chart.append("g")
                    .attr("class", "axis axisBottom")
                    .attr("transform", "translate(0,"+dims.chart.height+")")
                    .call(d3.axisBottom(x).ticks(null, "s"))
                    .append("text")
                    .attr("y", 2)
                    .attr("x", x(x.ticks().pop()) + 0.5)
                    .attr("dy", "0.32em")
                    .attr("fill", "#000")
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .text(label)
                    .attr("transform", "translate(-20,-10)");
        
                    }
            else {
                if (filter) {
                    if (filter === "wt_ave_base" || filter === "brixfactor" || filter === "tons") {
                        dataset = dataset.filter(d => d.level_2 == filter); 
                    }
                }

                if (districtValue != "allDistricts") {
                    dataset = dataset.filter(d => d.district === districtValue)
                }
                if (typeValue != "allTypes") {
                    dataset = dataset.filter(d => d.type === typeValue);
                }
                if(features.sort.dir === "desc"){
                    dataset.sort((a, b) => a[features.sort.col] - b[features.sort.col]);
                }
                if(features.sort.dir === "asc"){
                    dataset.sort((a, b) => b[features.sort.col] - a[features.sort.col]);            
                }
                
                var dims = getDims(id, parent.clientWidth, parent.clientHeight, dataset.length);
            
                var svg = d3.select(id)
                    .append("svg")
                    .attr("width", dims.svg.width)
                    .attr("height", dims.svg.height);
        
                var chart = svg.append("g")
                    .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);
        
                var y = d3.scaleBand()
                    .range([dims.chart.height, 0])
                    .padding(0.1)
                    .domain(dataset.map(d => d[features.y.col]));					
        
                var x = d3.scaleLinear()
                    .range([0, dims.chart.width])
                    .domain([0, d3.max(dataset, d => d[features.x.col])]).nice();

                chart.append("g")
                    .attr('class', geo.class)
                    .selectAll(geo.tag)
                    .data(dataset)
                    .enter().append(geo.tag)
                    .attr("y", d => y(d[features.y.col]))
                    .attr("x", 0)
                    .attr("fill", color(features.color))
                    .attr("width", d => x(d[features.x.col]))
                    .attr("height", y.bandwidth())
                    .attr("class", d => d.district)
                    .on('mouseover', function(d) {
                        var gClass = d3.select(this).attr('class')
                        d3.select('#tooltip').transition().duration(200).style('opacity', 1);
                        d3.select('#tooltip').html("<p>District "+gClass.slice(-2)+"</p><p>"+d.variety+"</p><p>Ave Base: $"+d.wt_ave_base+"</p><p>Tons: "+d3.format(".3s")(d.tons)+"</p><p>Revenue: "+d3.format("$,.2f")(d.revenue)+"</p>");
                        })
                    .on('mouseout', function() {
                        d3.select('#tooltip').style('opacity', 0)
                        })
                    .on('mousemove', function() {
                        d3.select('#tooltip').style('left', (d3.event.pageX+15) + 'px').style('top', (d3.event.pageY-35) + 'px')
                        });
                    
                chart.append("g")
                    .attr("class", "axis axisLeft")
                    .attr("transform", "translate(0,0)")
                    .call(d3.axisLeft(y));
    
                chart.append("g")
                    .attr("class", "axis axisTop")
                    .attr("transform", "translate(0,0)")
                    .call(d3.axisTop(x).ticks(null, "s"));

                chart.append("g")
                    .attr("class", "axis axisBottom")
                    .attr("transform", "translate(0,"+dims.chart.height+")")
                    .call(d3.axisBottom(x).ticks(null, "s"))
                    .append("text")
                    .attr("y", 2)
                    .attr("x", x(x.ticks().pop()) + 0.5)
                    .attr("dy", "0.32em")
                    .attr("fill", "#000")
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .text(label)
                    .attr("transform", "translate(-20,-10)");
        
                    }
        }

        if (features.x.format === "kDollar") {
            d3.selectAll(id+" .axisTop .tick text").text(d => "$"+(d/1000)+"k");
            d3.selectAll(id+" .axisBottom .tick text").text(d => "$"+(d/1000)+"k");
        }
        else if (features.x.format === "mDollar") {
            d3.selectAll(id+" .axisBottom .tick text").text(d => "$"+(d/1000000));
        }
        if (id === "#graphRev") {
            d3.selectAll(id + " .axisLeft .tick text").text(d => d);
        }
    });
}

// When the button is changed, run the build functions
function districtClick() {
    var districtValue = d3.select(this).attr("id");
    d3.select("#districtSelection").property("value", districtValue);
    var typeValue = d3.select("#typeSelection").node().value;
    d3.selectAll(".svgParent>svg").remove();

    // REVENUE BY DISTRICT
    buildGraph("#graphRev", "tall", {class: "dot", tag:"circle"}, {x: {col:"revenue", scale:"linear", format:"mDollar"}, y:{col:"brixfactor", scale:"linear"}, r: {col:"tons", scale:"linear"}, color:"district"}, "Millions", undefined, districtValue, typeValue);
    
    // SUM OF TONS BY DISTRICT
    buildGraph("#graphTons", "tall", {class:"bars", tag:"rect"}, {x: {col: "tons", scale:"linear"}, y: {col:"variety", scale:"band"}, color: districtValue, sort:{dir:"desc", col: "tons"}}, "Tons", undefined, districtValue, typeValue);

    // AVE OF WEIGHTED AVERAGE BASE BY DISTRICT
    buildGraph("#graphBase", "tall", {class:"bars", tag:"rect"}, {x:{col: "wt_ave_base", scale:"linear", format:"kDollar"}, y:{col:"variety", scale:"band"}, color: districtValue, sort: {dir:"desc", col: "wt_ave_base"}}, "Base", undefined, districtValue, typeValue);
};

function allDistrictsClick() {
    d3.select("#districtSelection").property("value","allDistricts");
    var typeValue = d3.select("#typeSelection").node().value;
    d3.selectAll(".svgParent>svg").remove();

    // REVENUE BY DISTRICT
    buildGraph("#graphRev", "tall", {class: "dot", tag:"circle"}, {x: {col:"revenue", scale:"linear", format:"mDollar"}, y:{col:"brixfactor", scale:"linear"}, r: {col:"tons", scale:"linear"}, color:"district"}, "Millions", undefined, "allDistricts", typeValue);

    // SUM OF TONS BY DISTRICT
    buildGraph("#graphTons", "wide", {class:"bars", tag:"rect"}, {x: {col:"total_tons", scale:"linear"}, y: {col:"variety", scale:"band"}, color: "district", sort:{dir:"desc", col:"total_tons"}}, "Tons", "tons", "allDistricts", typeValue);

    // AVE OF WEIGHTED AVERAGE BASE BY DISTRICT
    buildGraph("#graphBase", "wide", {class:"bars", tag:"rect"}, {x:{col:"aveBaseAll", scale:"linear", format:"kDollar"}, y:{col:"variety", scale:"band"}, color:"allDistricts", sort: {dir:"desc", col: "aveBaseAll"}}, "Base", "wt_ave_base", "alldDistricts", typeValue);
};

function typeClick() {
    var typeValue = d3.select(this).attr("id");
    d3.select("#typeSelection").property("value",typeValue);
    var districtValue = d3.select("#districtSelection").node().value;
    d3.selectAll(".svgParent>svg").remove();
    var colTons, colBase, filterTons, filterBase, shape;
    if (districtValue === "allDistricts") {
        colTons = "total_tons";
        colBase = "aveBaseAll";
        filterTons = "tons";
        filterBase = "wt_ave_base";
        shape = "wide";
    } 
    else {
        colTons = "tons";
        colBase = "wt_ave_base";
        shape = "tall";
    }

    // REVENUE BY DISTRICT
    buildGraph("#graphRev", "tall", {class: "dot", tag:"circle"}, {x: {col:"revenue", scale:"linear", format:"mDollar"}, y:{col:"brixfactor", scale:"linear"}, r: {col:"tons", scale:"linear"}, color:"district"}, "Millions", undefined, districtValue, typeValue);
    
    // SUM OF TONS BY DISTRICT
    buildGraph("#graphTons", shape, {class:"bars", tag:"rect"}, {x: {col: colTons, scale:"linear"}, y: {col:"variety", scale:"band"}, color: districtValue, sort:{dir:"desc", col: colTons}}, "Tons", filterTons, districtValue, typeValue);

    // AVE OF WEIGHTED AVERAGE BASE BY DISTRICT
    buildGraph("#graphBase", shape, {class:"bars", tag:"rect"}, {x:{col: colBase, scale:"linear", format:"kDollar"}, y:{col:"variety", scale:"band"}, color: districtValue, sort: {dir:"desc", col: colBase}}, "Base", filterBase, districtValue, typeValue);
};

function allTypesClick() {
    d3.select("#typeSelection").property("value","allTypes");
    var districtValue = d3.select("#districtSelection").node().value;
    d3.selectAll(".svgParent>svg").remove()
    var colTons, colBase, filterTons, filterBase, shape;
    if (districtValue === "allDistricts") {
        colTons = "total_tons";
        colBase = "aveBaseAll";
        filterTons = "tons";
        filterBase = "wt_ave_base";
        shape = "wide";
    } 
    else {
        colTons = "tons";
        colBase = "wt_ave_base";
        shape = "tall";
    }

    // REVENUE BY DISTRICT
    buildGraph("#graphRev", "tall", {class: "dot", tag:"circle"}, {x: {col:"revenue", scale:"linear", format:"mDollar"}, y:{col:"brixfactor", scale:"linear"}, r: {col:"tons", scale:"linear"}, color:"district"}, "Millions", undefined, districtValue);

    // SUM OF TONS BY DISTRICT
    buildGraph("#graphTons", shape, {class:"bars", tag:"rect"}, {x: {col: colTons, scale:"linear"}, y: {col:"variety", scale:"band"}, color: "district", sort:{dir:"desc", col:colTons}}, "Tons", filterTons, districtValue);

    // AVE OF WEIGHTED AVERAGE BASE BY DISTRICT
    buildGraph("#graphBase", shape, {class:"bars", tag:"rect"}, {x:{col: colBase, scale:"linear", format:"kDollar"}, y:{col:"variety", scale:"band"}, color:"allDistricts", sort: {dir:"desc", col: colBase}}, "Base", filterBase, districtValue);
};

// ADD TYPE MENU
var legend2 = d3.select("#legendParent svg")
    .append("g")
    .attr("transform", "translate(400,-2)")
    .attr("class", 'legend types')
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle");

legend2.append("text")
    .text("All Types")
    .attr("font-weight", "bold")
    .attr("transform", "translate(40,15)")
    .attr("class", "allTypes")
    .attr("style", "cursor:pointer")
    .on("click", allTypesClick);

var typesText = ["Red Wine", "White Wine", "Table", "Raisin"];
var typesColor = ["#722f37", "#ebd183", "#89b128", "#583432"];

var typeOptions = legend2.selectAll(".typeoption")
        .data(typesText)
        .enter().append("g")
        .attr("transform", (d, i) => "translate(" + (95 + i * 60) + ",0)");

typeOptions.append("rect")
        .attr("x", -25)
        .attr("y", 2)
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("width", 58)
        .attr("height", 19)
        .attr("fill", (d,i) => typesColor[i])
        .attr("style", "cursor:pointer")
        .attr("class", "typeoption")
        .attr("id", d => d)
        .style("pointer-events", "visible")
        .on("click", typeClick);

typeOptions.append("text")
        .attr("x", 5)
        .attr("y", 11)
        .attr("dy", "0.32em")
        .attr("fill", "#fff")
        .attr("style", "cursor:pointer")
        .attr("class", "option")
        .attr("id", d => d)
        .text(d => d)
        .style("pointer-events", "visible")
        .on("click", typeClick);

// REVENUE BY DISTRICT
buildGraph("#graphRev", "tall", {class: "dot", tag:"circle"}, {x: {col:"revenue", scale:"linear", format:"mDollar"}, y:{col:"brixfactor", scale:"linear"}, r: {col:"tons", scale:"linear"}, color:"district"}, "Millions");

// SUM OF TONS BY DISTRICT
buildGraph("#graphTons", "wide", {class:"bars", tag:"rect"}, {x: {col:"total_tons", scale:"linear"}, y: {col:"variety", scale:"band"}, color: "district", sort:{dir:"desc", col:"total_tons"}}, "Tons", undefined, "allDistricts");

// AVE OF WEIGHTED AVERAGE BASE BY DISTRICT
buildGraph("#graphBase", "wide", {class:"bars", tag:"rect"}, {x:{col:"aveBaseAll", scale:"linear", format:"kDollar"}, y:{col:"variety", scale:"band"}, color:"allDistricts", sort: {dir:"desc", col: "aveBaseAll"}}, "Base", "wt_ave_base");

d3.select('body').on('click', function(){d3.select('#tooltip').style('opacity', 0)});