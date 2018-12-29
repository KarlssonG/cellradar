import React, { Component } from "react"
import ReactDOM from "react-dom"
import { DatasetSelect, GeneBox, AppendCheckBox } from "./components.jsx"
import { SubmitButton, SvgDownload } from "./components.jsx"
import { rgb } from "d3-color";
import * as Radar from "./radar.js"

const SERVER = "http://206.189.14.208/cellradar"

class App extends React.Component {
    constructor () {
        super()
        this.state = {
            'geneBoxid': 'geneBox1', 'radarId': '#RadarChart',
            'datasets': [], 'cells': [],
            'selectedDataset': '', 'inputGenes': [],
            'SubmitButtonDisabled': false, 'doOverlay': true,
            'genes': {}, 'uidCounter': 0,
            'dataQueue' : 0, 'displayedData': [], 'displayInfo': {},
            'availColors' : null, 'fontSize': null,
            'geneBoxHeight': null, 'geneBoxWidth': null,
            'radarMargins': null, 'radarWidth': null,
            'pallete' : [
                rgb(76, 120, 168), rgb(245, 133, 24),
                rgb(228, 87, 86), rgb(114, 183, 178),
                rgb(84, 162, 75), rgb(238, 202, 59),
                rgb(178, 121, 162), rgb(255, 157, 166),
                rgb(157, 117, 93), rgb(186, 176, 172)
            ]
        }
        this.makeDimensions()
        this.fetchDatasets()
        Radar.initializeSvg(this.state.radarId,
            this.state.radarWidth, this.state.radarMargins)
        this.state.availColors = this.state.pallete
        console.log('SVG initialized and Constructor successfully executed')
    }
    makeDimensions () {
        console.log('Making dimensions')
        console.log(window.innerHeight)
        const input_store = document.getElementById('InputStoreEntry').getBoundingClientRect()
        const windowH = window.innerHeight*0.77
        this.state.geneBoxHeight = windowH - input_store.bottom + 'px'
        this.state.geneBoxWidth = input_store.offsetWidth + 'px'

        const radar_bb = document.querySelector(this.state.radarId).getBoundingClientRect()
        const radar_bb_width = radar_bb.right - radar_bb.left
        const SubBtnH = document.getElementById('SubmitButtonComp').clientHeight
        const radar_height =  Math.min((windowH - SubBtnH), radar_bb_width*0.7)
        this.state.radarWidth = 0.7*radar_height
        this.state.radarMargins = {
            'top': radar_height*0.1, 'bottom': radar_height*0.1, 
            'left': radar_height*0.15,
            'right': radar_height*0.15 + Math.min(radar_bb_width-radar_height, this.state.radarWidth/2), 
        }
        this.state.fontSize = this.state.radarWidth/30
    }

    fetchDatasets () {
        console.log('Fetching Datasets')
        fetch(SERVER + '/getdatasets')
            .then(response => response.json())
            .then(r => {
                console.log('Obtained Datasets')
                this.setState({'datasets': r.datasets})
                this.handleInputUpdate('selectedDataset', r.datasets[0].value)               
            })
    }

    componentDidUpdate () {
        ReactDOM.render(
            <SubmitButton isDisabled={this.state.SubmitButtonDisabled}
                          callBackFunc={() => this.fetchRadarData(this.state.inputGenes, null)} />,
            document.getElementById("SubmitButtonComp"))
        
        ReactDOM.render(
            <DatasetSelect datasets={this.state.datasets}
                fontsize={'16px'}
                callBackFunc={v => this.handleInputUpdate('selectedDataset', v)} />,
            document.getElementById("DatasetSelectComp"))
        
        ReactDOM.render(
            <GeneBox id={this.state.geneBoxid}
                    height={this.state.geneBoxHeight} width={this.state.geneBoxWidth}
                    callBackFunc={v => this.handleInputUpdate('inputGenes', v)} />,
            document.getElementById("GeneBoxComp"))
        
        ReactDOM.render(
            <AppendCheckBox
                callBackFunc={(v) => this.handleInputUpdate('doOverlay', v)}/>,
            document.getElementById("AppendCheckBoxComp"))

        ReactDOM.render(
            <SvgDownload radarWidth={this.state.radarWidth}
                radarMargins={this.state.radarMargins} />,
            document.getElementById("SvgDownloadComp"))
    }

    handleInputUpdate (s, v) {
        console.log('Updating ' + s)
        this.state[s] = v
        if (s == 'selectedDataset') {
            this.handleDatasetChange()
        }
    }

    handleDatasetChange() {
        console.log('Responding to updated dataset, fetching cells')
        const req_data = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({'dataset': this.state.selectedDataset})
        }
        fetch(SERVER + '/getcells', req_data)
            .then(response => response.json())
            .then(r => {
                if (r['msg'] == 'OK') {
                    console.log('Cells fetched, resetting the axis')
                    this.state.cells = r.cells
                    console.log(r.cells)
                    Radar.removeBlocks(['axisWrapper', 'plotWrapper', 'sideInfoWrapper'])
                    console.log('Old plot stripped')
                    Radar.plotAxis(this.state.cells, this.state.radarWidth, this.state.fontSize)
                    console.log('New axis plotted')
                    if (this.state.doOverlay) {
                        console.log('Will rerender the plot with for new dataset')
                        this.state.displayedData.forEach(uid => {
                            this.fetchRadarData(null, uid)
                        })
                    }
                }
                else { alert (r.msg) }
            })
    }

    fetchRadarData (gene_list, uid) {
        if (this.state.displayedData.length == 10) {
            alert ('Only upto 10 datatsets can be loaded at a time!')
            return false
        }
        if (this.state.doOverlay == false) {
            console.log('Not overlaying, resetting the data')
            Radar.removeBlocks(['plotWrapper', 'sideInfoWrapper'])
            this.setState({
                'genes': {}, 'uidCounter': 0, 'dataQueue': 0,
                'displayedData': [], 'displayInfo': {},
                'availColors' : this.state.pallete,    
            })
        }
        let rollback_active
        if (gene_list == null) {
            if (uid == null) {
                console.log('ERROR :Null params in fetchRadarData')
                return false
            }
            else {
                console.log('Got saved raw gene list')
                gene_list = this.state.genes[uid].raw
            }
            rollback_active = false
        }
        else {
            console.log('New genelist obtained. Updating state data')
            this.state.uidCounter += 1
            uid = this.state.uidCounter
            this.state.genes[this.state.uidCounter] = {
                'raw': gene_list, 'filtered': {}
            }
            this.state.displayInfo[this.state.uidCounter] = {
                'color' : this.state.availColors.shift(),
                'hidden': false,
                'clicked': false,
                'label': 'List ' + this.state.uidCounter
            }
            this.state.displayedData.push(uid)
            rollback_active = true
        }
        console.log('Fetching radarData')
        this.setState({'SubmitButtonDisabled': true})
        const req_data = {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({
                'dataset': this.state.selectedDataset,
                'genes': gene_list})
        }
        fetch(SERVER + '/makeradar', req_data)
            .then(response => response.json())
            .then(r => {
                if (r.msg == 'OK') {
                    document.getElementById(this.state.geneBoxid).value = r.genes
                    this.state.genes[uid].filtered[this.state.selectedDataset] = r.genes
                    r.values[0].pop()
                    this.plotRadarData(r.values[0], uid)
                    this.plotSideInfo(uid)

                    if (rollback_active) {
                        this.setState({'SubmitButtonDisabled': false})
                    }
                    else {
                        this.state.dataQueue += 1
                        if (this.state.dataQueue == this.state.displayedData.length) {
                            console.log ('All data aggregated. Releasing submit button')
                            this.setState({'SubmitButtonDisabled': false})
                            this.state.dataQueue = 0
                        }
                    }
                }
                else {
                    alert (r.msg)
                    if (rollback_active) {
                        this.state.displayedData.pop()
                    }
                    this.setState({'SubmitButtonDisabled': false})
                }
        })
    }

    plotRadarData (data, uid) {
        console.log('Plotting Radar area for UID: ' + uid)
        Radar.plotRadar(
            uid, data,
            this.state.displayInfo[uid].color,
            this.state.cells.length, this.state.radarWidth,
            (i, e) => Radar.coordinateHighlight(
                i, e, this.state.displayInfo, this.state.displayedData)
        )
        Radar.toggleVisibility(uid, this.state.displayInfo[uid].hidden)
    }

    plotSideInfo (uid) {
        console.log('Plotting Side info for UID: ' + uid)
        const ypos = this.state.displayedData.indexOf(uid)*this.state.radarWidth/10
        Radar.makeSideGroup(uid)
        Radar.makeCloseButton (
            uid, ypos, (i, e) => Radar.toggleCloseBtn(i, e),
            i => {
                this.state.availColors.push(this.state.displayInfo[uid].color)
                this.state.displayedData = this.state.displayedData
                    .filter((x) => {return x!=i})
                Radar.removePlot(i)
                Radar.removeBlocks(['sideInfoWrapper'])
                this.state.displayedData.forEach(i => {
                    this.plotSideInfo(i)
                })
            }
        )
        Radar.makeHideToggle (
            uid, ypos,this.state.displayInfo[uid].hidden,
            (i) => {
                if (!this.state.displayInfo[uid].hidden) {
                    this.state.displayInfo[uid].clicked = false
                }
                Radar.coordinateHighlight(i, 'click', this.state.displayInfo,
                                    this.state.displayedData)
                this.state.displayInfo[uid].hidden = 
                    !this.state.displayInfo[uid].hidden
                Radar.toggleVisibility(i, this.state.displayInfo[uid].hidden)
            }
        )
        Radar.makeLegend(
            uid, ypos, 50, this.state.fontSize,
            this.state.displayInfo[uid].label, this.state.displayInfo[uid].color,
            (i, e) => {
                if (e == 'click')  {
                    if (!this.state.displayInfo[uid].hidden) {
                        this.state.displayInfo[uid].clicked = 
                            !this.state.displayInfo[uid].clicked
                    }
                }
                Radar.coordinateHighlight(i, e, this.state.displayInfo,
                                    this.state.displayedData)
            },
            (text) => {
                this.state.displayInfo[uid].label = text
            }
        )
        Radar.coordinateHighlight(uid, 'click', this.state.displayInfo,
                                    this.state.displayedData)
    }

    render () {
        return null
    }
}

export default App
