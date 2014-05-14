
angular.module('sbDragAndDrop', [])

  .config(function () {
    if (window.jQuery) jQuery.event.props.push('dataTransfer'); 
  })

  .provider('sbDragController', [function () {

    var Ctrl = function () {
      this._counter = 0;
      this._elements = {};
      this._data = {};
      this._completed = {};
    };

    Ctrl.prototype.dragStart = function (event, element, data) {
      var id = String(++this._counter);
      event.dataTransfer.setData('sbDragId', id);
      this._data[id] = data;
      this._elements[id] = element;
    };

    Ctrl.prototype.getId = function (event) {
      var id =  event.dataTransfer.getData('sbDragId');

      // Work around some browsers not allowing getData on dragend
      if (!id) {
        for (id in this._elements) {
          if (this._elements[id] === event.target) break;
        }
      }
      return id;
    };

    Ctrl.prototype.getContext = function (event) {
      var id = this.getId(event);
      return {
        $event: event, 
        $data: this._data[id],
        $element: this._elements[id],
        $completed: this._completed[id]
      };
    };

    Ctrl.prototype.setCompleted = function (event) {
      this._completed[this.getId(event)] = true;
    };

    Ctrl.prototype.dragEnd = function (event) {
      var id = this.getId(event);

      if (id) {
        delete this._data[id];
        delete this._elements[id];
        delete this._completed[id];
      }
    };

    this.$get = function () {
      return new Ctrl();
    };
  }])

  .directive('sbDraggable', ['$parse', 'sbDragController', function($parse, ctrl) {

    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        attrs.$set('draggable', true);

        var handlers = {};

        ['Dragstart', 'Drag', 'Dragend'].forEach(function (name) {
          name = 'sb'+name;
          if (name in attrs) {
            var fn = $parse(attrs[name]);
            handlers[name] = function (event) {
              return scope.$apply(function () {
                return fn(scope, ctrl.getContext(event));
              });
            };
          }
          else handlers[name] = angular.noop;
        });

        function callHandler(name, event) {
          if (name in handlers) handlers[name](event);
        }

        elem.bind('dragstart', function(event) {
          ctrl.dragStart(event, elem, scope.$eval(attrs.sbDragdata));
          var res = handlers.sbDragstart(event);
          if (res === false) {
            ctrl.dragEnd(event);
            return false;
          }
          attrs.$addClass('sb-dragging');
        });

        elem.bind('dragend', function(event) {
          handlers.sbDragend(event);
          ctrl.dragEnd(event);
          attrs.$removeClass('sb-dragging');
        });
      }
    };
  }])

  .directive('sbDropTarget', ['$parse', 'sbDragController', function($parse, ctrl) {

    return {
      restrict: 'A',
      link: function(scope, elem, attrs, controller) {
        var dropEffect = attrs.sbDropEffect || 'move';
        var handlers = {};

        ['Dragenter', 'Dragover', 'Dragleave', 'Drop'].forEach(function (name) {
          name = 'sb'+name;
          if (name in attrs) {
            var fn = $parse(attrs[name]);
            handlers[name] = function (event) {
              return scope.$apply(function () {
                return fn(scope, ctrl.getContext(event));
              });
            };
          }
          else handlers[name] = angular.noop;
        });

        // With HTML's drag and drop event handling calling preventDefault enables 
        // the element as a drop zone. The opposite behaviour (returning false to disable 
        // the dropzone) Seems more appropriate here...

        elem.bind('dragenter', function(event) {
          var res = handlers.sbDragenter(event);
          if (res === false) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = dropEffect;
          attrs.$addClass('sb-dragover');
        });

        elem.bind('dragover', function(event) {
          var res = handlers.sbDragover(event);
          if (res === false) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = dropEffect;
        });

        elem.bind('dragleave', function(event) {
          handlers.sbDragleave(event);
          attrs.$removeClass('sb-dragover');
        });

        elem.bind('drop', function(event) {
          // calling preventDefault stops the browser's native drop handling
          if (event.preventDefault) event.preventDefault();
          if (event.stopPropagation) event.stopPropagation();
          var res = handlers.sbDrop(event);
          if (res !== false) ctrl.setCompleted(event);
          attrs.$removeClass('sb-dragover');
        });
      }
    };
  }]);
