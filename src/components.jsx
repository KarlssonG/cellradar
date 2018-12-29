import React, { Component } from "react"
import ReactDOM from "react-dom"

class DatasetSelect extends React.Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.datasets.length == nextProps.datasets.length) {
            return false
        }
        return true
    }
    render () {
        console.log('Rendering DatasetSelect')
        return (
            <select style={{"fontSize": this.props.fontsize}}
                onChange={e => this.props.callBackFunc(e.target.value)}>
                {this.props.datasets.map(item => (
                    <option key={item.id}>{item.value}</option>
                ))}
            </select>
        )
    }
}

class GeneBox extends React.Component {
    shouldComponentUpdate() {
        return false
    }
    onTextUpdate(v) {
        this.props.callBackFunc(v.split("\n").filter(g => g.length > 0))
    }
    render () {
        console.log('Rendering GeneBox')
        console.log(
            this.props.width, this.props.height
        )
        return (
            <textarea id={this.props.id} 
                style={{'width':this.props.width, 'height':this.props.height}}
                onInput={e => this.onTextUpdate(e.target.value)} />
        )
    }
}

class AppendCheckBox extends React.Component {
    constructor () {
        super()
        this.state = {'checked': true}
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.checked == nextState.checked) {
            return false
        }
        return true
    }
    handleClick () {
        this.state.checked = !this.state.checked
        this.props.callBackFunc(this.state.checked)
    }
    render() {
        console.log('Rendering AppendCheckBox')
        return (
            <input type="checkbox" defaultChecked={this.state.checked}
                onInput={(e) => this.handleClick()}/>
        )   
    }
}

class SubmitButton extends React.Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.isDisabled == nextProps.isDisabled) {
            return false
        }
        return true
    }
    render() {
        console.log('Rendering SubmitButton')
        return (
            <div>
                {this.props.isDisabled ?
                    <button className="btn btn-danger" disabled>Loading...</button>:
                    <button className="btn btn-info"
                            onClick={this.props.callBackFunc}>Submit</button>
                }
            </div>
        )   
    }
}

class SvgDownload extends React.Component {
    makeSvg () {
        if (document.querySelector('svg') != null) {
            // let x = d3.select('.sideInfoWrapper')[0][0].children
            // Array.from(x).forEach(function (i) {i.remove()})
            const svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(document.querySelector('svg')))
            // this.props.displayedData.forEach(i => {
            //     this.props.plotSideInfo(i)
            // })
            return svgString
        }
    }
    handleDownload(data, ext) {
        const a = document.createElement('a')
        a.href = data
        a.download = 'CellRadar.' + ext
        a.click()
    }
    handlePngClick () {
        console.log('Making PNG')
        const canvas = document.createElement('canvas')
        canvas.width = 3*(this.props.radarWidth+
                          this.props.radarMargins.left+
                          this.props.radarMargins.right)
        canvas.height = 3*(this.props.radarWidth+
                           this.props.radarMargins.top+
                           this.props.radarMargins.bottom)
        const ctx = canvas.getContext('2d')
        ctx.scale(3,3)
        const img = new Image()
        img.src = this.makeSvg()
        img.onload = () => {
            ctx.drawImage(img, 0, 0)
            this.handleDownload(canvas.toDataURL(), 'png')
        }
    }
    handleSvgClick () {
        this.handleDownload(this.makeSvg(), 'svg')
    }
    render () {
        console.log ('Rendering SvgDownload')
        return (
            <div>
                <button className="btn btn-secondary" style={{'marginRight': '5px'}}
                        onClick={(e) => this.handleSvgClick()}>
                    SVG
                </button>
                <button className="btn btn-secondary"
                        onClick={(e) => this.handlePngClick()}>
                    PNG
                </button>
            </div>
        )
    }
}

export {
    DatasetSelect,
    GeneBox,
    AppendCheckBox,
    SubmitButton,
    SvgDownload
}
