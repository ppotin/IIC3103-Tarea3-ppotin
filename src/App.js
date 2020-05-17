import React from 'react'
import logo from './logo.svg'
import './App.css'
import io from 'socket.io-client'
import { render } from 'react-dom'
import Chart from 'react-google-charts'
import Switch from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Select, { components } from 'react-select'

// const socket = io('https://le-18262636.bitzonte.com/', {
//   path: '/stocks'
// })

export default class App extends React.Component {
  // eslint-disable-next-line no-useless-constructor
  constructor (props) {
    super(props)
    this.state = {
      status: 'OFF',
      checked: true,
      contador: 0,
      stocks: new Map(),
      exchanges: new Map(),
      selected: [],
      selected2: []
    }
    this.activarSocket = this.activarSocket.bind(this)
    this.createStock = this.createStock.bind(this)
    this.getStocksInfo = this.getStocksInfo.bind(this)
    this.getExchangesInfo = this.getExchangesInfo.bind(this)
    this.createExchange = this.createExchange.bind(this)
    this.createStock = this.createStock.bind(this)
  };

  componentDidMount = () => {
    this.activarSocket(this.state.status)
    this.getStocksInfo()
    this.getExchangesInfo()
  }

  getStocksInfo = () => {
    var socketInfo = io('wss://le-18262636.bitzonte.com/', {
      path: '/stocks'
    })
    socketInfo.emit('STOCKS' /* */)
    socketInfo.on('STOCKS', (data) => {
      // console.log(data)
      data.forEach((stock) => {
        this.createStock(stock.ticker, stock.company_name, stock.country, stock.quote_base)
      })
    })
  }

  getExchangesInfo = () => {
    var socketInfo = io('wss://le-18262636.bitzonte.com/', {
      path: '/stocks'
    })
    socketInfo.emit('EXCHANGES' /* */)
    socketInfo.on('EXCHANGES', (data) => {
      // console.log(Object.entries(data))
      Object.entries(data).forEach((exchange) => {
        this.createExchange(exchange[1].name, exchange[1].exchange_ticker, exchange[1].country, exchange[1].address, exchange[1].listed_companies)
      })
    })
  }

  createStock = (ticker, name, country, quote) => {
    var options = this.state.options
    var stock = {
      ticker: ticker,
      name: name,
      country: country,
      quote: quote,
      data: [['x', ticker]],
      stats: [0, 10000, 0],
      lastValue: 0,
      sellBuy: [0, 0]
    }

    var dic = this.state.stocks
    var aux = dic.set(ticker, stock)
    this.setState({ stocks: dic, options: options })
    return aux
  }

  createExchange = (name, ticker, country, address, companies) => {
    var exchange = {
      ticker: ticker,
      name: name,
      country: country,
      address: address,
      companies: companies,
      stocks: [],
      buy: 0,
      sell: 0,
      total: 0,
      numStocks: 0,
      share: 0
    }

    this.state.stocks.forEach((stock) => {
      if (exchange.companies.includes(stock.name)) {
        exchange.stocks.push(stock.ticker)
      }
    })

    // console.log(exchange)

    var dic = this.state.exchanges
    var aux = dic.set(ticker, exchange)
    this.setState({ exchanges: dic })
    return aux
  }

  activarSocket = (s) => {
    if (s === 'ON') {
      console.log('Apagamos el socket')
      this.state.socket.close()
      this.setState({ status: 'OFF', checked: false, contador: 0 })
    } else {
      this.setState({ stocks: new Map() })
      this.getStocksInfo()
      this.getExchangesInfo()
      console.log('Prendimos el socket')
      var socketAux = io('wss://le-18262636.bitzonte.com/', {
        path: '/stocks'
      })
      socketAux.on('UPDATE', (data) => {
        // console.log("Update:\t", data);

        // if (data.ticker === "FB") {
        //   console.log(this.state.stocks.get("FB"));

        // }

        var stocks = this.state.stocks

        if (!stocks.has(data.ticker)) {
          this.createStock(data.ticker)
        } else {
        }

        var stock = this.state.stocks.get(data.ticker)

        var time = new Date(data.time)
        var value = data.value

        var max = stock.stats[0]
        var min = stock.stats[1]
        var delta = Number((((value - stock.lastValue) / stock.lastValue) * 100).toFixed(3))

        if (value > max) {
          max = value
        }
        if (value < min) {
          min = value
        }
        if (stock.data.length > 100) {
          stock.data.splice(1, 1)
        }

        stock.lastValue = value
        stock.data.push([time, value])
        stock.stats[0] = max
        stock.stats[1] = min
        stock.stats[2] = delta

        var contador = this.state.contador
        contador += 1
        this.setState({ contador: contador })
        // this.createDataExchange()
      })
      socketAux.on('BUY', (data) => {
        var stock = this.state.stocks.get(data.ticker)

        if (stock) {
          stock.sellBuy[0] = data.volume
        }
      })
      socketAux.on('SELL', (data) => {
        var stock = this.state.stocks.get(data.ticker)

        if (stock) {
          stock.sellBuy[1] = data.volume
        }
      })
      this.setState({ status: 'ON', socket: socketAux, checked: true })
    };
  }

  refreshSelected = () => {
    var news = []
    this.state.selected.forEach((stock) => {
      news.push(this.state.stocks.get(stock.ticker))
    })
    // console.log(news)
    this.setState({ selected: news })
  }

  handleChange = (values) => {
    var selecionados = []
    if (values) {
      values.forEach((stock) => {
        selecionados.push(stock.value)
      })
    }
    this.setState({ selected: selecionados })
  }

  handleChange2 = (values) => {
    var selecionados = []
    if (values) {
      values.forEach((exchange) => {
        selecionados.push(exchange.value)
      })
    }
    this.setState({ selected2: selecionados })
  }

  render () {
    // if (this.state.exchanges.get('NASDAQ')) {
    //   console.log(this.state.exchanges.get('NASDAQ').stocks[0])
    // }
    function createData (total, max, min, last, delta) {
      return { total, max, min, last, delta }
    }

    var myloop = []
    var myloop2 = []
    var options = []
    var options2 = []

    this.state.stocks.forEach(function (value, key) {
      options.push({ label: value.name, value: value })
    })

    this.state.selected.forEach(function (value) {
      const rows = [
        createData(value.sellBuy[0] + value.sellBuy[1],
          value.stats[0], value.stats[1],
          value.lastValue, value.stats[2])
      ]
      const style = { backgroundColor: '#282c34', color: 'white', align: 'center' }
      var applePor = { backgroundColor: '#282c34', color: 'white', align: 'center' }
      if (value.stats[2] > 0) {
        applePor = { backgroundColor: '#282c34', color: 'green', align: 'center' }
      } else {
        applePor = { backgroundColor: '#282c34', color: 'red', align: 'center' }
      }
      var chartTextStyle = { color: '#FFF' }
      const classes = makeStyles({
        table: {
          minWidth: 650
        }
      })

      myloop.push(
        <div className='Stock-Container'>
          <div className='Data-Container'>
            <h2>{value.name}<br></br>{value.ticker} - {value.country}</h2>
            <TableContainer component={Paper}>
              <Table className={classes.table} style={style} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={style} align="center">Volumen&nbsp;Total&nbsp;transado</TableCell>
                    <TableCell style={style} align="center">Alto&nbsp;historico</TableCell>
                    <TableCell style={style} align="center">Bajo&nbsp;historico</TableCell>
                    <TableCell style={style} align="center">Ultimo&nbsp;Precio</TableCell>
                    <TableCell style={style} align="center">Variacion&nbsp;Porcentual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell style={style} align="center">{row.total}</TableCell>
                      <TableCell style={style} align="center">{row.max}</TableCell>
                      <TableCell style={style} align="center">{row.min}</TableCell>
                      <TableCell style={style} align="center">{row.last}</TableCell>
                      <TableCell style={applePor} align="center">{row.delta}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <Chart
            width={'600px'}
            height={'400px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={value.data}
            options={{
              hAxis: {
                title: 'Hora',
                format: 'HH:mm:ss',
                textStyle: chartTextStyle,
              	titleTextStyle: chartTextStyle
              },
              vAxis: {
                title: 'Precio' + ' (' + value.quote + ')',
                textStyle: chartTextStyle,
	              titleTextStyle: chartTextStyle,
                gridlines: { color: '#787878' }
              },
              legend: {
                textStyle: chartTextStyle
              },
              colors: ['white'],
              backgroundColor: { fill: 'transparent' }
            }}
            rootProps={{ 'data-testid': '1' }}
          />
        </div>
      )
    })

    function createData2 (stocks, exchangeStocks) {
      var buy = 0
      var sell = 0
      var total = 0
      var numStocks = 0
      var share = 0
      // console.log(exchangeStocks)
      exchangeStocks.forEach((ticker) => {
        var stock = stocks.get(ticker)
        if (stock) {
          buy += stock.stats[0]
          sell += stock.stats[1]
          numStocks += 1
        }
      })
      total = Number((sell + buy).toFixed(3))
      buy = Number((buy).toFixed(3))
      sell = Number((sell).toFixed(3))
      // console.log({ buy, sell, total, numStocks, share })
      return { buy, sell, total, numStocks, share }
    }

    var dataExchanges = [['Exchange', 'participación']]

    this.state.exchanges.forEach(function (value, key) {
      options2.push({ label: value.name, value: value })
    })

    var stocks = this.state.stocks

    this.state.selected2.forEach(function (exchange) {
      const rows2 = [
        createData2(stocks, exchange.stocks)
      ]

      dataExchanges.push([exchange.name, rows2[0].total])
      const style = { backgroundColor: '#282c34', color: 'white', align: 'center' }

      var chartTextStyle = { color: '#FFF' }
      const classes = makeStyles({
        table: {
          minWidth: 650
        }
      })

      myloop2.push(
        <div className='Stock-Container'>
          <div className='Data-Container'>
            <h2>{exchange.name}<br></br>{exchange.ticker} - {exchange.country}<br></br>{exchange.address}</h2>
            <TableContainer component={Paper}>
              <Table className={classes.table} style={style} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={style} align="center">Volumen&nbsp;Compra</TableCell>
                    <TableCell style={style} align="center">Volumen&nbsp;Venta</TableCell>
                    <TableCell style={style} align="center">Volumen&nbsp;Total</TableCell>
                    <TableCell style={style} align="center">Cantidad&nbsp;Acciones</TableCell>
                    <TableCell style={style} align="center">Participación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows2.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell style={style} align="center">{row.buy}</TableCell>
                      <TableCell style={style} align="center">{row.sell}</TableCell>
                      <TableCell style={style} align="center">{row.total}</TableCell>
                      <TableCell style={style} align="center">{row.numStocks}</TableCell>
                      <TableCell style={style} align="center">{row.share}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      )
    })

    console.log(dataExchanges)

    const customStyles = {
      input: (provided, state) => ({
        borderBottom: '1px dotted pink',
        padding: 20,
        width: '300px',
        align: 'left',
        height: '10px'
      }),
      option: (provided, state) => ({
        borderBottom: '1px dotted pink',
        color: state.isSelected ? 'green' : 'black',
        backgroundColor: state.isFocused ? 'gray' : 'white',
        padding: 20,
        hover: 'gray'
      }),
      menu: (provided, state) => ({
        ...provided,
        width: '500px',
        borderBottom: '1px dotted pink',
        color: 'black',
        padding: 0
      })
    }

    // const controlStyles = {
    //   borderRadius: '1px solid black',
    //   padding: '5px',
    //   background: '#282c34',
    //   color: 'white'
    // }

    // const ControlComponent = props => (
    //   <div style={controlStyles}>
    //     {<p>Selecciona una empresa</p>}
    //     <components.Control {...props} />
    //   </div>
    // )

    const indicatorSeparatorStyle = {
      alignSelf: 'stretch',
      backgroundColor: '#282c34',
      marginBottom: 8,
      marginTop: 8,
      width: 1
    }

    const IndicatorSeparator = ({ innerProps }) => {
      return <span style={indicatorSeparatorStyle} {...innerProps} />
    }

    return (
      <div className="App">
        <header className="App-header">
          <p>
            Ultimate Financial Dashboard
          </p>
          <FormControlLabel
            control={
              <Switch
                onChange={() => { this.activarSocket(this.state.status) }}
                checked={this.state.checked}
                name="checkedA"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
              />
            }
            label="ON/OFF"
          />
        </header>
        <body className='App-body'>
          <h1 align='left'>Stocks</h1>
          <hr color='white' width='1400'></hr>
          <div align='left'>
            <Select
              isClearable
              placeholder="Selecciona empresa..."
              components={{ IndicatorSeparator }}
              isMulti
              name="name"
              options={options}
              onChange={(values) => { this.handleChange(values) }}
              styles={customStyles}
            />
          </div>
          {myloop}
          <h1 align='left'>Exchanges</h1>
          <hr color='white' width='1400'></hr>
          <div align='left'>
            <Select
              isClearable
              placeholder="Selecciona Mercado..."
              components={{ IndicatorSeparator }}
              isMulti
              name="name"
              options={options2}
              onChange={(values) => { this.handleChange2(values) }}
              styles={customStyles}
            />
          </div>
          {myloop2}
          <Chart
            width={'600px'}
            height={'400px'}
            chartType="PieChart"
            loader={<div>Loading Chart</div>}
            data={dataExchanges}
            options={{
              title: 'Participación de mercado',
              titleTextStyle: {
                color: 'white',
                align: 'center'
              },
              legend: {
                textStyle: { color: 'white' }
              },
              is3D: true,
              backgroundColor: { fill: 'transparent' }
            }}
            rootProps={{ 'data-testid': '1' }}
          />
        </body>
      </div>
    )
  }
}
