var React = require('react');

var styles = {
  container: {
    maxWidth: 550,
    background: '#cdc',
    border: '1px solid #777',
    listStyle: 'none',
    margin: 0,
    padding: 2
  },
  item: {
    backgroundColor: '#df90df',
    margin: 3,
    padding: 3
  }
}

var Container = React.createClass({
  displayName: "Container",

  propTypes: {
    items: React.PropTypes.array.isRequired,
    itemTemplate: React.PropTypes.func,
  },

  getDefaultProps: function() {
    return {
      items: [],
      itemTemplate: TextTemplate
    }
  },

  getInitialState: function() {
    return {
      items: this.props.items
    }
  },

  renderListElement: function(item, key) {
    return (
      <li key={key} style={styles.items}>{item}</li>
    );
  },

  render: function() {
    var items = this.state.items.map(this.renderListElement);
    return (
      <ul ref="container" style={styles.container}>{items}</ul>
    )
  }
});

var TextTemplate = React.createClass({
  displayName: "Container-TextTemplate",

  propTypes: {
    item: React.PropTypes.any.isRequired
  },

  render: function() {
    return <span>{this.props.items}</span>;
  }
})

module.exports = Container;
