var React = require('react');
var Set = require('./support/SimpleSet');

var ALLOWED_DROP_EFFECT = "move"
  ,DRAG_DROP_CONTENT_TYPE = "custom_container_type"
  ,NO_HOVER = -1;

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
  },
  selectedItem: {
    backgroundColor: '#333'
  },
  dropZone: {
    height: 2,
    backgroundColor: 'transparent',
    transition: 'height 400ms'
  },
  activeDropZone: {
    height: 15,
    background: '#fff',
    transition: 'height 150ms'
  }
};

var TextTemplate = React.createClass({
  displayName: "Container-TextTemplate",

  propTypes: {
    item: React.PropTypes.any.isRequired
  },

  render: function() {
    return <span>{this.props.item}</span>;
  }
});

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
      items: this.props.items,
      selected: new Set(),
      hoverOver: NO_HOVER
    }
  },

  onDragStart: function(e) {
    var selectedIndex = parseInt(e.currentTarget.getAttribute('data-key'));

    this.state.selected.add(selectedIndex);

    e.dataTransfer.effectAllowed = ALLOWED_DROP_EFFECT;
    e.dataTransfer.setData(DRAG_DROP_CONTENT_TYPE, JSON.stringify(this.getSelectedItems()));

    this.setState({ selected: this.state.selected });
  },

  onDragOverItem: function(e) {
    if (this.containerAcceptsDropData(e.dataTransfer.types)) {
      e.preventDefault();

      var over = parseInt(e.currentTarget.getAttribute('data-key'));

      if (e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) {
        over++;
      }

      if (over !== this.state.hoverOver) {
        this.setState({ hoverOver: over });
      }
    }
  },

  onDragOverDropZone: function(e) {
    if (this.containerAcceptsDropData(e.dataTransfer.types)) {
      e.preventDefault();

      var dropZoneId = parseInt(e.currentTarget.getAttribute('data-key'));

      if (dropZoneId !== this.state.hoverOver) {
        this.setState({ hoverOver: dropZoneId });
      }
    }
  },

  onDragLeaveContainer: function(e) {
    var x = e.clientX
      , y = e.clientY
      , top = e.currentTarget.offsetTop
      , bottom = top + e.currentTarget.offsetHeight
      , left = e.currentTarget.offsetLeft
      , right = left + e.currentTarget.offsetWidth;

    if (y <= top || y >= bottom || x <= left || x >= right) {
      this.resetHover();
    }
  },

  onDrop: function(e) {
    var data = JSON.parse(e.dataTransfer.getData(DRAG_DROP_CONTENT_TYPE));

    if (this.state.hoverOver != NO_HOVER) {
      Array.prototype.splice.apply(this.state.items, [this.state.hoverOver, 0].concat(data));
      this.correctSelectedAfterDrop(data);

      this.setState({
        items: this.state.items,
        selected: this.state.selected,
        hoverOver: NO_HOVER
      });
    }
  },

  onDragEnd: function(e) {
    if (e.dataTransfer.dropEffect === ALLOWED_DROP_EFFECT) {
      this.removeSelectedItems();
      this.state.selected.clear();

      this.setState({
        items: this.state.items,
        selected: this.state.selected,
        hoverOver: NO_HOVER
      });
      return;
    }

    if (this.state.hoverOver !== NO_HOVER || this.state.selected.size !== 0) {
      this.state.selected.clear();
      this.setState({ hoverOver: NO_HOVER, selected: this.state.selected});
    }
  },

  onClickOnListItem: function(e) {
    var selectedIndex = parseInt(e.currentTarget.getAttribute('data-key'));
    this.toggleSelectedItem(selectedIndex);
    this.setState({ selected: this.state.selected });
  },

  containerAcceptsDropData: function(transferTypes) {
    return Array.prototype.indexOf.call(transferTypes, DRAG_DROP_CONTENT_TYPE) !== -1;
  },

  resetHover: function(e) {
    if (this.state.hoverOver !== NO_HOVER) {
      this.setState({ hoverOver: NO_HOVER });
    }
  },

  toggleSelectedItem: function(selectedIndex) {
    return this.state.selected.has(selectedIndex) ? this.state.selected.delete(selectedIndex) :
      this.state.selected.add(selectedIndex);
  },

  getSelectedItems: function() {
    return this.state.selected.toArray().sort().map(function(itemIndex) {
      return this.state.items[itemIndex]
    }, this);
  },

  correctSelectedAfterDrop: function(droppedItems) {
    if (this.state.hoverOver !== NO_HOVER) {
      var bumpSet = []
        , bumpBy = droppedItems.length;

      this.state.selected.forEach(function(itemId) {
        if(itemId >= this.state.hoverOver) {
          bumpset.push(itemId);
        }
      }, this);

      bumpSet.forEach(function(itemId) { this.state.selected.delete(itemId); });
      bumpSet.forEach(function(itemId) { this.state.selected.add(itemId + bumpBy); });
    }
  },

  removeSelectedItems: function() {
    return this.state.selected.toArray().sort().reverse().map(function(itemId) {
      return this.state.items.splice(itemId, 1);
    }, this);
  },

  renderListElements: function() {
    var items = [];

    for (var i = 0, length = this.state.items.length; i < length; i++) {
      items.push(this.renderDropZone(i))
      items.push(this.renderListElement(
        React.createElement(this.props.itemTemplate, { item: this.state.items[i] }), i));
    }

    items.push(this.renderDropZone(i));

    return items;
  },

  renderListElement: function(item, key) {
    return (
      <li key={key}
        data-key={key}
        style={merge(styles.item, this.state.selected.has(key) && styles.selectedItem)}
        className={this.state.selected.has(key) ? 'container-selected' : ''}
        onClick={this.onClickOnListItem}
        draggable={true}
        onDragOver={this.onDragOverItem}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}>{item}</li>
    );
  },

  renderDropZone: function(index) {
    return (
      <li key={"dropzone-" + index}
        data-key={index}
        style={merge(styles.dropZone, this.state.hoverOver === index && styles.activeDropZone)}
        className={this.state.hoverOver === index ? 'container-dropZone-active' : ''}
        onDragOver={this.onDragOverDropZone}></li>
    )
  },

  render: function() {
    var items = this.renderListElements();
    return (
      <ul ref="container"
        onDrop={this.onDrop}
        onDragLeave={this.onDragLeaveContainer}
        style={styles.container}>{items}</ul>
    );
  }
});

module.exports = Container;

function merge() {
  var res = {};
  for (var i = 0; i < arguments.length; ++i) {
    if (arguments[i]) {
      objectAssign(res, arguments[i]);
    }
  }
  return res;
}

function ToObject(val) {
  if (val == null) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
}

var objectAssign = Object.assign || function (target, source) {
  var from;
  var keys;
  var to = ToObject(target);

  for (var s = 1; s < arguments.length; s++) {
    from = arguments[s];
    keys = Object.keys(Object(from));

    for (var i = 0; i < keys.length; i++) {
      to[keys[i]] = from[keys[i]];
    }
  }

  return to;
};
