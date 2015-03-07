jest.dontMock('../Container');

var React = require('react/addons')
  ,TestUtils = React.addons.TestUtils
  ,Container = require('../Container')

var randomWords = ['apple', 'banana', 'orange', 'pine'];

describe('Container', function() {

  var CONTAINER_TYPE = 'custom_container_type'
    ,CONTENER_DROP_ZONE_ACTIVE = 'container-dropZone-active';

  var CustomTemplate = React.createClass({
    displayName: 'CustomTemplate',
    propTypes: { item: React.PropTypes.any.isRequired },
    render: function() { return <span className="customFinder">{this.props.item}</span> }
  });

  var container, overItem, dropZoneAbove, dropZoneBelow, mockEvent;

  beforeEach(function() {
    mockEvent = {
      dataTransfer: { types: [CONTAINER_TYPE] },
      preventDefault: jest.genMockFunction()
    };

    container = TestUtils.renderIntoDocument(<Container itemTemplate={CustomTemplate} items={randomWords.slice(0)} />);

    overItem = getItemFromContainer(container, randomWords.length - 1);
    dropZoneAbove = getDropZone(container, randomWords.length - 1);
    dropZoneBelow = getDropZone(container, randomWords.length);
  });

  it('should display items, by default, in a text template (span element)', function() {
    var container = TestUtils.renderIntoDocument(<Container items={randomWords}/>);
    expect(container.getDOMNode().textContent).toBe(randomWords.join(''))
  });

  it('should display items with a custom template', function() {
    var container = TestUtils.renderIntoDocument(<Container itemTemplate={CustomTemplate} items={randomWords} />);
    var items = TestUtils.scryRenderedDOMComponentsWithClass(container, 'customFinder').map(function(item) {
      return item.getDOMNode().textContent;
    });

    expect(items).toEqual(randomWords);
  });

  it('should mark items as draggable', function() {
    var item = getItemFromContainer(container, 0);

    expect(item.getDOMNode().getAttribute('draggable')).toBeTruthy();
  });

  it('should not mark drop zones as draggable', function() {
    var dropZone = TestUtils.scryRenderedDOMComponentsWithTag(container, 'li')[0];

    expect(dropZone.getDOMNode().getAttribute('draggable')).toBeFalsy();
  });

  it('highlights item as selected when being dragged', function() {
    var item = getItemFromContainer(container, 0)
      ,mockDataTransfer = { setData: jest.genMockFunction() };

    expect(item.props.className).toBe('');
    TestUtils.Simulate.dragStart(item, { dataTransfer: mockDataTransfer });
    expect(item.props.className).toBe('container-selected')
  });

  it('should set the data transfer with the correct type and items to being dragged', function() {
    var item = getItemFromContainer(container, 0)
      ,mockDataTransfer = { setData: jest.genMockFunction() };

    TestUtils.Simulate.dragStart(item, { dataTransfer: mockDataTransfer} );
    expect(mockDataTransfer.setData).toBeCalledWith(CONTAINER_TYPE, 'apple');
  });

  it('shows the current dropZone when hovering over drop zone', function() {
    var dropZone = getDropZone(container, 0);

    expect(dropZone.props.className).toBe('');
    TestUtils.Simulate.dragOver(dropZone, mockEvent);
    expect(dropZone.props.className).toBe(CONTENER_DROP_ZONE_ACTIVE);
    expect(mockEvent.preventDefault).toBeCalled();
  });

  it('should not activate a dropzone when the container type is wrong', function() {
    var container = TestUtils.renderIntoDocument(<Container itemTemplate={CustomTemplate} items={randomWords} />)
      , dropZone = getDropZone(container, 0);

    var mockEvent = {
      dataTransfer: { types: ['bad_type'] },
      preventDefault: jest.genMockFunction()
    };

    expect(dropZone.props.className).toBe('');
    TestUtils.Simulate.dragOver(dropZone, mockEvent);
    expect(dropZone.props.className).not.toBe(CONTENER_DROP_ZONE_ACTIVE);
    expect(mockEvent.preventDefault).not.toBeCalled();
  });

  it('shows previous drop zone when hovering over top half of item', function() {
    mockEvent.clientY = 2;
    overItem.getDOMNode().offsetTop = 0;
    overItem.getDOMNode().offsetHeight = 10;

    expect(dropZoneAbove.props.className).toBe('');
    expect(dropZoneBelow.props.className).toBe('');

    TestUtils.Simulate.dragOver(overItem, mockEvent);

    expect(dropZoneAbove.props.className).toBe(CONTENER_DROP_ZONE_ACTIVE);
    expect(dropZoneBelow.props.className).toBe('');
    expect(mockEvent.preventDefault).toBeCalled();
  });

  it('shows next drop zone when hovering over bottom half of item', function() {
    mockEvent.clientY = 7;
    overItem.getDOMNode().offsetTop = 0;
    overItem.getDOMNode().offsetHeight = 10;

    expect(dropZoneAbove.props.className).toBe('');
    expect(dropZoneBelow.props.className).toBe('');

    TestUtils.Simulate.dragOver(overItem, mockEvent);

    expect(dropZoneAbove.props.className).toBe('');
    expect(dropZoneBelow.props.className).toBe(CONTENER_DROP_ZONE_ACTIVE);
    expect(mockEvent.preventDefault).toBeCalled();
  });

  it('should clear any active drop zones when the dragged item leaves the container', function() {
    var containerElement = TestUtils.findRenderedDOMComponentWithTag(container, 'ul').getDOMNode();

    TestUtils.Simulate.dragOver(overItem, mockEvent);
    expect(TestUtils.scryRenderedDOMComponentsWithClass(container, CONTENER_DROP_ZONE_ACTIVE).length).toBe(1);

    mockEvent.clientX = 0;
    mockEvent.clientY = 101;
    containerElement.offsetTop = containerElement.offsetLeft = 0;
    containerElement.offsetHeight = containerElement.offsetWidth = 100;

    TestUtils.Simulate.dragLeave(containerElement, mockEvent);
    expect(TestUtils.scryRenderedDOMComponentsWithClass(container, CONTENER_DROP_ZONE_ACTIVE).length).toBe(0);
  });

  it('adds dropped items to currently selected drop zone', function() {
    mockEvent.dataTransfer.getData = function() { return 'peaches'; }

    TestUtils.Simulate.dragOver(dropZoneBelow, mockEvent);
    TestUtils.Simulate.drop(dropZoneBelow, mockEvent);

    var items = TestUtils.scryRenderedDOMComponentsWithClass(container, 'customFinder').map(function(item) {
      return item.getDOMNode().textContent;
    });

    expect(items).toEqual(randomWords.concat(["peaches"]));
  });

  it('removes selected items', function() {
    var item = getItemFromContainer(container, 0);

    mockEvent.dataTransfer.dropEffect = "move";
    mockEvent.dataTransfer.setData = function() {}
    mockEvent.dataTransfer.getData = function() { return randomWords[0]; }

    TestUtils.Simulate.dragStart(item, mockEvent);
    TestUtils.Simulate.dragOver(dropZoneBelow, mockEvent);
    TestUtils.Simulate.drop(dropZoneBelow, mockEvent);
    TestUtils.Simulate.dragEnd(item, mockEvent);

    var items = TestUtils.scryRenderedDOMComponentsWithClass(container, 'customFinder').map(function(item) {
      return item.getDOMNode().textContent;
    });

    expect(items).toEqual(randomWords.slice(1).concat(randomWords[0]));
  });

  function getItemFromContainer(container, itemId) {
    return TestUtils.scryRenderedDOMComponentsWithTag(container, 'li')[2 * itemId + 1];
  }

  function getDropZone(container, itemId) {
    return TestUtils.scryRenderedDOMComponentsWithTag(container, 'li')[2 * itemId];
  }
});
