
angular.module('sbDragAndDrop', [])

  .provider('sbDragController', [function () {

    var Ctrl = function () {
      this._counter = 0;
      this._elements = {};
      this._data = {};
    };

    Ctrl.prototype.dragStart = function (event, element, data) {
      var id = String(++this._counter);
      event.dataTransfer.setData('sbDragId', id);
      this._data[id] = data;
      this._elements[id] = element;
    };

    Ctrl.prototype.getId = function (event) {
      return event.dataTransfer.getData('sbDragId');
    };

    Ctrl.prototype.getData = function (event) {
      return this._data[this.getId(event)];
    };

    Ctrl.prototype.getElement = function (event) {
      return this._elements[this.getId(event)];
    };

    Ctrl.prototype.dragEnd = function (event) {
      var id = this.getId(event);

      // Work around some browsers not allowing getData on dragend
      if (!id) {
        for (id in this._elements) {
          if (this._elements[id] === event.target) break;
        }
      }

      if (id) {
        delete this._data[id];
        delete this._elements[id];
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
          window.ctrl = ctrl;
          attrs.$set('draggable', true);

          elem.bind('dragstart', function(event) {
            attrs.$addClass('sb-dragging');

            ctrl.dragStart(event, elem, scope.$eval(attrs.sbDragdata));

            if ('sbDragstart' in attrs) {
              var fn = $parse(attrs.sbDragstart);
              // Dont trigger digest here - rely on click event
              fn(scope, {$event:event, $element: elem});
            }
          });

          elem.bind('dragend', function(event) {
            attrs.$removeClass('sb-dragging');
            ctrl.dragEnd(event);
          });
        }
      };
    }])

  .directive('sbDropTarget', ['$parse', 'sbDragController', function($parse, ctrl) {

    // To do: handle dragenter event?

    return {
      restrict: 'A',
      link: function(scope, elem, attrs, controller) {
        var dropEffect = attrs.sbDropEffect || 'move';
        var onDragOver = function (e) {};
        var onDrop = function (e) {};

        if ('sbDragover' in attrs) {
          var overFn = $parse(attrs.sbDragover);
          onDragOver = function (e) {
            return scope.$apply(function () {
              return overFn(scope, {$event:e, $data: ctrl.getData(e)});
            });
          };
        }


        if ('sbDrop' in attrs) {
          var dropFn = $parse(attrs.sbDrop);
          onDrop = function (e) {
            scope.$apply(function () {
              dropFn(scope, {$event:e, $data: ctrl.getData(e)});
            });
          };
        }

        elem.bind('dragover', function(e) {
          var res = onDragOver(e);

          if (res !== false) {
            // Prevent default tells browser drop is permitted
            e.preventDefault();
            e.dataTransfer.dropEffect = dropEffect;
            attrs.$addClass('sb-dragover');
          }
        });

        elem.bind('dragleave', function(e) {
          attrs.$removeClass('sb-dragover');
        });

        elem.bind('drop', function(e) {
          attrs.$removeClass('sb-dragover');

          // Prevent default browser drop handling
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();

          onDrop(e);
        });
      }
    };
  }]);
