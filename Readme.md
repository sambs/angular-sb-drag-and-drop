HTML5 drag and drop for AngularJS
---------------------------------

Data driven:

    <div sb-draggable sb-dragdata="{{obj.id}}">{{obj.title}}</div>

Drop targets:

    <div sb-drop-target sb-drop-effect="copy"></div>

Set drop effect and take care of the awkward preventDefault() calls on dragover & dragenter events necessary to enable dropping.

Event handlers injectable with:

 - `$event` native drag event  
 - `$data`, data defined in sb-dragdata
 - `$element` the element being dragged
 - `$completed` boolean specifying whether drag has been handled by a drop zone.


    <div sb-draggable sb-dragend="onDragend($completed)"></div>
    <div sb-drop-target sb-drop="onDrop($data)"></div>

