import React, {Component} from 'react';
import blessed from 'blessed';
import {render} from 'react-blessed';
import { exec, spawn } from 'child_process';
import glob from 'glob';
import debounce from 'debounce';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchString: '',
      results: 'No files matched.',
      elapsedTime: ''
    };
  }


  componentDidMount() {
    // Focus on the first box
    this.refs.input.focus();
  }

  search = debounce(
    (searchText) => {
      if (searchText === '') {
        this.setState({
          results: 'No files matched.'
        });
        return;
      }
      this.setState({
        results: ''
      });
      const startTime = process.hrtime();

      // If a previous process is running, kill it.
      if (this.find) {
        this.find.kill();
      }

      // Use spawn instead of exec because of various problems: speed and stdout buffer overflows.
      this.find = spawn('find', ['.', '-ipath', `*${searchText}*`]);

      this.find.stdout.on('data', (data) => {
        const time = process.hrtime(startTime);
        const elapsed = time[0] + time[1] / 1000000000;
        if (this.state.results.length > 500) {
          return;
        }
        if (!data) {
          this.setState({
            results: 'No files matched.',
            elapsedTime: elapsed
          });
        } else {
          this.setState((prevState) => {
            return {
              results: prevState.results + data.toString(),
              elapsedTime: elapsed
            }
          });
        }
      });
    },
    200
  )

  onKeypress = () => {
    setTimeout(() => {
      const { value } = this.refs.input;
      this.setState({
        searchString: value
      })
      this.search(this.state.searchString);
    }, 0 );
  }

  render() {

    return (
      <form>
        <textbox
          inputOnFocus
          ref="input"
          value={this.state.searchString}
          width="100%"
          height="15%"
          onKeypress={this.onKeypress}
          border={{type: 'line'}}
        />
        <box
          width="100%"
          height="85%"
          top="15%"
          >
          <box>{`Results in ${this.state.elapsedTime}`}</box>
          <box top="15%">{this.state.results}</box>
        </box>
      </form>
    );
  }
}

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'react-blessed box animation'
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

render(<App />, screen);
