const ChordJogApp = (() => {
    const Style = {
        width: 800,
        height: 800,
        stroke: {
            width: 1},
        colors: {
            black: "#000000",
            superHeavy: "#202020",
            heavy: "#464646",
            medium: "#909090",
            light: "#A0A0A0",
            superLight: "#F6F6F6",
            white: "#ffffff"}};
    Style.stroke.halfWidth = Style.stroke.width * .5;
    Style.textColor = Style.colors.heavy;

    /**
     * A wrapper for the Module pattern
     */
    const Module = {of: (f, ...args) => f.apply(undefined, args)};

    const Functions = {
        ifThen: (condition, then) => condition === true ? then() : undefined,
        ifThenFinal: (condition, then, final) => {
            if(condition) then();
            return final(); },
        ifThenElse: (condition, then, fElse) => condition === true ? then() : fElse(),
        ifThenElseFinal: (condition, then, fElse, final) => {
            condition === true ? then() : fElse();
            return final();}};

    const Objects = Module.of(() => {
        const helpers = {
            withGetter: function(key, getter) {
                Object.defineProperty(this, key, {
                    get: getter,
                    configurable: true});
                return this; },
            withSetter: function(key, setter) {
                Object.defineProperty(this, key, {
                    set: setter,
                    configurable: true});
                return this; },
            withGetterAndSetter: function(key, getter, setter) {
                Object.defineProperty(this, key, {
                    get: getter,
                    set: setter,
                    configurable: true});
                return this; },
            withGettersAndSetters: function(gettersAndSetters) {
                gettersAndSetters.forEach(property =>
                    Object.defineProperty(this, property.key, {
                        get: property.get,
                        set: property.set,
                        configurable: true}));
                return this;},
            withField(key, value=undefined) {
                this[key] = value;
                return this;},
            withFields(fields) {
                Object.keys(fields).forEach(key => this[key] = fields[key]);
                return this;},
            withProperty: function (key, property) {
                Object.defineProperty(this, key, property);
                return this; },
            withProperties: function(properties) {
                Object.defineProperties(this, properties);
                return this},
            withMutation: function(mutation) {
                mutation(this);
                return this; },
            withMutations: function(mutations) {
                mutations.forEach(mutation => mutation.bind(this)());
                return this; },
            withMethod: function(name, method) {
                this[name] = method.bind(this);
                return this; },
            withMethods: function(methods) {
                Object.keys(methods).forEach(key =>
                    this[key] = methods[key].bind(this));
                return this; }};
        const objects = {
            isNil: Module.of((nils = [null, undefined]) =>
                (object) => nils.includes(object)),
            using: (object) => helpers.withMethods.bind(object)(helpers),
            withField: (object, key, value) => {
                object[key] = value;
                return object;},
            withFields: (object, fieldKeyValues) => {
                Object.entries(fieldKeyValues).forEach(fieldKeyValue => object[fieldKeyValue[0]] = fieldKeyValue[1]);
                return object;}};
        objects.new = () => objects.using({});
        return objects;});
    const Numbers = {
        goldenRatio: (1+Math.sqrt(5))/2,
        range: (fromInclusive, toExclusive) => {
            let range = [];
            for(let i = fromInclusive; i < toExclusive; ++i) {
                range.push(i);}
            return range;},
        clamp: (value, fromInclusive, toInclusive) =>
            value < fromInclusive ? fromInclusive :
                value > toInclusive ? toInclusive :
                    value};
    const Arrays = {
        replaceItem: (array, index, replacement) => {
            array[index] = replacement;
            return array;},
        updateItem: (array, index, modification) => {
            modification(array[index]);
            return array;},
        findLast: (array, predicate) => array[Numbers
            .range(0, array.length)
            .reverse()
            .find(i => predicate(array[i]))],
        lastIndexOf: (array, predicate) => {
            for(let i = array.length - 1; i >= 0; --i) {
                if(predicate(array[i])) {
                    return i;}}
            return undefined; },
        last: (array) => array[array.length - 1]};

    const KeyboardCommands = Module.of(() => {
        const keyCommands = {};
        window.addEventListener("keydown", (e) => Functions.ifThen(
            e.key in keyCommands,
            keyCommands[e.key]));
        return {
            set: (key, command) => keyCommands[key] = command,
            setAll: (keyCommandMap) => Objects.using(keyCommands).withFields(keyCommandMap),
            remove: (key) => delete keyCommands[key],
            removeAll: (keys) => keys.forEach(key => delete keyCommands[key]) };});
    const MouseEvents = {
        relativeMousePosition: (mouseEvent, relativeTo) => {
            const boundingClientRect = relativeTo.getBoundingClientRect();
            return [
                mouseEvent.clientX - boundingClientRect.x,
                mouseEvent.clientY - boundingClientRect.y];}};

    const Geometry = {
        distance2: (a, b) =>
            Math.pow(a[0] - b[0], 2) +
            Math.pow(a[1] - b[1], 2),
        projectPointOnLineSegment:  (p, segment) => {
            const px = p[0] - segment[0][0],
                py = p[1] - segment[0][1],
                ux = segment[1][0] - segment[0][0],
                uy = segment[1][1] - segment[0][1],
                k = Numbers.clamp((px*ux + py*uy) / (ux*ux + uy*uy), 0, 1)
            //proj(p, u) = k*u
            return [segment[0][0] + k * ux, segment[0][1] + k * uy]; }};

    const AffineTransformations = Module.of(() => {  //for 2d space
        const indices = [0, 1, 2];
        const AffineTransformations = {
            fromABCDEF: (a,b,c,d,e,f) => [[a,b,c],[d,e,f],[0, 0, 1]],
            transform: (T, x) => ((x1=x.concat(1)) =>
                indices.map((i) =>
                    indices.reduce(
                        (sum, j) => sum + T[i][j] * x1[j],
                        0)))()
                .slice(0,2),
            compose: (A, B) => indices.map((i) =>
                indices.map((j) =>
                    indices.reduce(
                        (sum, k) => sum + A[i][k] * B[k][j],
                        0)))};
        AffineTransformations.identity = () => (
            (identity=AffineTransformations.fromABCDEF(1,0,0,0,1,0)) => identity.slice())();
        AffineTransformations.reflection = () => (
            (reflection=AffineTransformations.fromABCDEF(-1,0,0,0,1,0)) => reflection.slice())();
        AffineTransformations.translation = (x,y) => AffineTransformations.fromABCDEF(1,0,x,0,1,y);
        AffineTransformations.scale = (sx, sy=sx) => AffineTransformations.fromABCDEF(sx,0,0,0,sy,0);
        AffineTransformations.rotation = (theta) => ((cos=Math.cos(theta), sin=Math.sin(theta)) =>
            AffineTransformations.fromABCDEF(cos,-sin,0,sin,cos,0,0,0,1))();
        return AffineTransformations;});

    const Strings = {
        count: 6,
        range: (min, max) => ({
            min: min,
            max: max})};
    Strings.all = Numbers.range(1, Strings.count+1);
    Strings.first = Strings.all[0];
    Strings.last = Strings.all[Strings.count - 1];

    const Fingers = {
        thumb: "T",
        index: "1",
        middle: "2",
        ring: "3",
        pinky: "4",
        any: "*"};
    Fingers.all = [
        Fingers.thumb,
        Fingers.index,
        Fingers.middle,
        Fingers.ring,
        Fingers.pinky ];
    Fingers.count = Fingers.all.length;

    const Frets = {
        open: "o",
        first: 1,
        last: 15,
        maxRoot: 11,
        Relative: {
            root: 1,
            max: 5 },
        Range: {
            create: (min, max) => ({
                min: min,
                max: max }),
            equals: (a, b) => a.min === b.min && a.max === b.max}};
    Frets.fretted = Numbers.range(Frets.first, Frets.last);
    Frets.roots = Frets.fretted.slice(0, Frets.maxRoot);
    Frets.roots.first = Frets.roots[0];
    Frets.roots.last = Frets.roots[Frets.roots.length - 1];
    Frets.all = [Frets.open].concat(Frets.fretted);
    Frets.isFretted = Frets.fretted.includes;
    Frets.isOpen = (fret) => ! Frets.isFretted(fret);
    Frets.Relative.all = Numbers.range(
        Frets.Relative.root,
        Frets.Relative.max+1);
    Frets.Relative.count = Frets.Relative.all.length;
    Frets.Relative.first = Frets.Relative.all[0];
    Frets.Relative.last = Frets.Relative.all[Frets.Relative.count - 1];
    Frets.Range.roots = Frets.Range.create(Frets.roots.first, Frets.roots.last);

    const SVG = Module.of(() => {
        const dashifyAttributeName = (name) =>
            Numbers.range(0, name.length)
                .map(charIndex => ((curChar) =>
                    curChar === curChar.toLowerCase() ?
                        curChar : "-" + curChar.toLowerCase())(
                    name.charAt(charIndex)))
                .join("");
        const createElement = function(tagName) {
            const ModifiedEventListeners = Module.of((value = {
                mousedown: {},
                mouseup: {}}
            ) => ({
                appliesToEventType: eventType => Object.keys(value).includes(eventType),
                registerEventListener: (eventType, listener, thisReference) => {
                    const boundListener = listener.bind(thisReference);
                    const modifiedListener = function(e) {
                        //Left mouse button only
                        if(e.button === 0) {
                            boundListener(e);}};
                    value[eventType][listener] = modifiedListener;
                    return modifiedListener; },
                unregisterEventListener: (eventType, listener) => {
                    const modified = value[eventType][listener];
                    delete value[eventType][listener];
                    return modified; }}));
            return Objects
                .using(document.createElementNS("http://www.w3.org/2000/svg", tagName))
                .withMethods({
                    withAttribute: function(name, value) {
                        this.setAttribute(dashifyAttributeName(name), value)
                        return this; },
                    withAttributes: function(attributes) {
                        Object.keys(attributes).forEach(name => {
                            if(["x", "y"].includes(name) && isNaN(attributes[name])) {
                                throw "Attribute " + name + " is not a number";}
                            this.setAttribute(dashifyAttributeName(name), attributes[name]);})
                        return this; },
                    withoutAttribute: function(name) {
                        this.removeAttribute(name);
                        return this; },
                    withoutAttributes: function(names) {
                        names.forEach(name => this.removeAttribute(name));
                        return this; },
                    withDataAttribute: function(name, value) {
                        this.dataset[name] = value;
                        return this; },
                    withDataAttributes: function(dataAttributes) {
                        Object.keys(dataAttributes).forEach(dataAttribute =>
                            this.dataset[dataAttribute] = dataAttributes[dataAttribute]);
                        return this; },
                    withClass: function(className) {
                        this.classList.add(className);
                        return this; },
                    withClasses: function(...classes) {
                        this.classList.add(classes);
                        return this; },
                    withChild: function(child) {
                        this.append(child);
                        return this; },
                    withChildren: function(children) {
                        children.forEach(child => this.appendChild(child));
                        return this; },
                    withoutChild: function(child) {
                        this.removeChild(child);
                        return this;},
                    withoutChildren: function(children) {
                        children.forEach(child => this.removeChild(child));
                        return this;},
                    withEventListener: function(eventType, listener) {
                        eventType = eventType.toLowerCase();
                        this.addEventListener(eventType,
                            ModifiedEventListeners.appliesToEventType(eventType) ?
                                ModifiedEventListeners.registerEventListener(eventType, listener, this) :
                                listener);
                        return this; },
                    withEventListeners: function(eventListeners) {
                        Object.keys(eventListeners).forEach(eventType =>
                            this.withEventListener(eventType, eventListeners[eventType]));
                        return this; },
                    withoutEventListener: function(eventType, listener) {
                        eventType = eventType.toLowerCase();
                        this.removeEventListener(eventType,
                            ModifiedEventListeners.appliesToEventType(eventType) ?
                                ModifiedEventListeners.unregisterEventListener(eventType, listener) :
                                listener);
                        return this;},
                    withoutEventListeners: function(eventListeners) {
                        Object.keys(eventListeners).forEach(eventType =>
                            this.withoutEventListener(eventType, eventListeners[eventType]));
                        return this;},
                    withAttributeChangeListener: function(
                        attributeName,
                        listener,
                        attributeExtractor=(mutation) => mutation.target.getAttribute(attributeName)
                    ) {
                        new MutationObserver((mutations) => mutations
                            .map(mutation => ({
                                oldValue: mutation.oldValue,
                                value: attributeExtractor.bind(mutation.target)(mutation),
                                target: mutation.target}))
                            .forEach(e => listener.bind(e.target)({
                                oldValue: e.oldValue,
                                value: e.value})))
                            .observe(this, {
                                attributeFilter: [attributeName],
                                attributeOldValue: true});
                        return this;},
                    withAttributeChangeListeners: function(attributeChangeListeners) {
                        Object
                            .entries(attributeChangeListeners)
                            .forEach(entry => this.withAttributeChangeListener(
                                entry[0],
                                entry[1].listener,
                                entry[1].attributeExtractor));
                        return this;},
                    withModification: function(modification) {
                        modification.bind(this)();
                        return this;},
                    hide: function() {return this.withAttribute("display", "none");},
                    show: function() {return this.withoutAttribute("display");},
                    disableTextSelection: function() {
                        ["webkitUserSelect", "mozUserSelect", "msUserSelect", "userSelect"]
                            .forEach(selectAttribute => this.style[selectAttribute] = "none");
                        return this; }})
                .withMethods(Module.of(() => {
                    const updateTransform = (element, transformKey, values) => {
                        const valuesString = values.join(" ");
                        const transformAttribute = element.getAttribute("transform");
                        if(transformAttribute === null) {   //Does the element have a transform attribute?
                            //No. Add it.
                            element.setAttribute("transform", `${transformKey}(${valuesString})`);
                            return;}
                        const indexTransform = transformAttribute.lastIndexOf(transformKey);
                        if(indexTransform === -1) { //Does the transform attribute include a matching transform type?
                            //No. Create and append a transform of the given type the to attribute
                            element.setAttribute("transform",
                                `${transformAttribute} ${transformKey}(${valuesString})`);
                            return;}
                        //Transform of the given type does exist.
                        //Replace the transform attribute with its arguments updated.
                        const indexArgsStart = indexTransform + `${transformKey}(`.length;
                        const indexArgsEnd = transformAttribute.indexOf(")", indexArgsStart);
                        element.setAttribute("transform",
                            transformAttribute.slice(0, indexArgsStart) +
                            valuesString +
                            transformAttribute.slice(indexArgsEnd));};
                    return Module.of((x=0, y=0, sx=1, sy=1, rotation=0) => ({
                        move: function(dx, dy) {
                            x += dx * 1 / sx;
                            y += dy * 1 / sy;
                            updateTransform(this, "translate", [x, y]);
                            return this;},
                        moveTo: function(x, y) {
                            const boundingClientRect = this.getBoundingClientRect();
                            return this.move(x - boundingClientRect.x, y - boundingClientRect.y);},
                        rotateTo: function(degrees, origin=[0,0]) {
                            rotation = degrees % 360;
                            updateTransform(this, "rotate", [rotation, origin[0], origin[1]]);
                            return this;},
                        rotateBy: function(degrees, origin=[0,0]) {
                            return this.rotateTo(rotation +  degrees, origin);},
                        scale: function(scaleX, scaleY=scaleX) {
                            sx *= scaleX;
                            sy *= scaleY;
                            updateTransform(this, "scale", [sx, sy]);
                            return this;}}));}))
                .withField("eventListeners", {});};
        const svgBuilder = {
            element: createElement,
            G: () => createElement("g"),
            Circle: Module.of((
                createCircle=()=>createElement("circle")
                    .withGetterAndSetter("centerX",
                        function() {
                            return this.getAttribute("cx");},
                        function(centerX) {
                            this.setAttribute("cx", centerX);})
                    .withMethod("withCenterX",
                        function(centerX) {
                            this.centerX = centerX;
                            return this;})
                    .withGetterAndSetter("centerY",
                        function() {
                            return this.getAttribute("cy");},
                        function(centerY) {
                            this.setAttribute("cy", centerY);})
                    .withMethod("withCenterY",
                        function(centerY) {
                            this.centerY = centerY;
                            return this;})
                    .withGetterAndSetter("center",
                        function() {
                            return [this.centerX, this.centerY]},
                        function(center) {
                            this.centerX = center[0];
                            this.centerY = center[1];})
                    .withMethod("withCenter",
                        function(center) {
                            this.center = center;
                            return this;})
                    .withGetterAndSetter("radius",
                        function() {
                            return this.getAttribute("r");},
                        function(radius) {
                            this.setAttribute("r", radius);})
                    .withMethod("withRadius",
                        function(radius) {
                            this.radius = radius;
                            return this;}),
                withCenterStep=center=>Module.of((circle=createCircle().withCenter(center)) => ({
                    withoutRadius: () => circle,
                    withRadius: radius => circle.withRadius(radius)}))
            ) => ({
                withoutCenter: () => withCenterStep([0, 0]),
                withCenter: center => withCenterStep(center)})),
            Ellipse: ({
                withCenter: (c) => ({
                    withRadius: (r) => createElement("ellipse")
                        .withAttributes({
                            cx: c[0],
                            cy: c[1],
                            rx: r instanceof Array ? r[0] : r,
                            ry: r instanceof Array ? r[1] : r }) }) }),
            Line: Module.of(
                (createLine = () =>
                    createElement("line").withMethod("withEndpoints",
                        function(a, b) {
                            return this.withAttributes({
                                x1: a[0],
                                y1: a[1],
                                x2: b[0],
                                y2: b[1] });})
                ) => ({
                    withEndpoints: (p1, p2) => createLine().withEndpoints(p1, p2),
                    withoutEndpoints: () => createLine()})),
            ModularGrid: {
                withX: x => ({
                    withY: y => ({
                        withWidth: width => ({
                            withModuleWidth: moduleWidth => ({
                                withModuleHeight: moduleHeight => ({
                                    withPadding: (horizontalPadding, verticalPadding=horizontalPadding) => Module.of((
                                        withModulesStep=modules=>Module.of((
                                            numColumnsAndColumnIndexToModuleX=(numColumns, columnIndex)=>
                                                .5*width +
                                                (columnIndex-numColumns/2)*moduleWidth +
                                                (columnIndex-(numColumns-1)/2)*horizontalPadding,
                                            rowIndexToModuleY=rowIndex=>rowIndex*(moduleHeight+verticalPadding),
                                            numColumnsToInnerWidth=numColumns=>numColumns*(moduleWidth+horizontalPadding)-horizontalPadding,
                                        )=> SVG.Builder.G()
                                            .withClass("modular-grid")
                                            .moveTo(x, y)
                                            .withGetterAndSetter("modules",
                                                () => modules,
                                                function(newModules) {
                                                    //Remove old modules
                                                    modules.forEach(module => {
                                                        if(module.parentNode === this) {
                                                            this.removeChild(module);}});
                                                    //Move the new modules to their coordinates and append them to the grid
                                                    modules = newModules;
                                                    Module.of((
                                                        numColumns=Arrays.findLast(
                                                            Numbers.range(1, 1+modules.length),
                                                            numColumns=>{
                                                                return numColumnsToInnerWidth(numColumns)<=width;}),
                                                        moduleIndexToCoordinates=moduleIndex=>Module.of((
                                                            rowIndex=Math.ceil((moduleIndex+1)/numColumns)-1
                                                        ) => [
                                                            numColumnsAndColumnIndexToModuleX(
                                                                //How many columns are in this row?
                                                                rowIndex < Math.ceil(modules.length/numColumns)-1 ?  //Not the last row?
                                                                    numColumns :        //Yes: numColumns
                                                                    Module.of((         //No: the number of columns on the last row
                                                                        remainder=modules.length%numColumns
                                                                    )=> remainder > 0 ? remainder : numColumns),
                                                                moduleIndex%numColumns),
                                                            rowIndexToModuleY(rowIndex)])
                                                    )=> modules.forEach((module, index)=> this.append(
                                                        module.moveTo(...moduleIndexToCoordinates(index)))));})
                                            .withMethod("withModules", function(modules) {
                                                this.modules = modules;
                                                return this;})
                                            .withModules(modules))
                                    ) => ({
                                        withModule: module => withModulesStep([module]),
                                        withModules: modules => withModulesStep(modules),
                                        withoutModules: () => withModulesStep([])}))})})})})})},
            Path: ({
                withD: (d) => createElement("path")
                    .withAttributes({d: d}) }),
            Rect: ({
                withX: (x) => ({
                    withY: (y) => ({
                        withWidth: (width) => ({
                            withHeight: (height) => {
                                const rect = createElement("rect")
                                    .withAttributes({
                                        x: x,
                                        y: y,
                                        width: width,
                                        height: height});
                                rect.withMethods({
                                    withRx: (rx) => rect.withAttribute("rx", rx),
                                    withRy: (ry) => rect.withAttribute("ry", ry)});
                                rect.withMethod("withRadius", (r) => rect.withRx(r).withRy(r))
                                return rect;}})})})}),
            SVG: {
                withWidth: (width) => ({
                    withHeight: (height) => createElement("svg")
                        .withAttributes({
                            viewBox: `0 0 ${width} ${height}`,
                            xmlns: "xmlns='http://www.w3.org/2000/svg'",
                            width: width,
                            height: height })})},
            Text: Module.of((
                createText = () => createElement("text")
                    .withMethods({
                        withTextContent: function(textContent) {
                            this.textContent = textContent;
                            return this;},
                        withoutTextcontent: function() {
                            this.textContent = null;
                            return this;},
                        withTextLength: function(value) {
                            this.setAttribute("textLength", value);
                            return this; },
                        withLengthAdjustSpacing: function() {
                            this.setAttribute("lengthAdjust", "spacing");
                            return this; },
                        withLengthAdjustSpacingAndGlyphs: function() {
                            this.setAttribute("lengthAdjust", "spacingAndGlyphs");
                            return this; }})
                    .withAttributes({
                        fill: Style.textColor})) => ({
                withTextContent: (textContent) => createText().withTextContent(textContent),
                withoutTextContent: () => createText()}))};
        svgBuilder.Rect.copy = (svgRect) => SVG.Builder.Rect
            .withX(svgRect.x)
            .withY(svgRect.y)
            .withWidth(svgRect.width)
            .withHeight(svgRect.height);
        svgBuilder.TextButton = {
            withDimensions: (x, y, width, height) => ({
                withText: (text) => ({
                    withClickHandler: (clickHandler) => {
                        let rect = null;
                        const label = SVG.Builder.Text
                            .withTextContent(text)
                            .moveTo(.5 * width, .5 * height)
                            .withClass("text-button-label")
                            .withAttributes({
                                textAnchor: "middle",
                                dominantBaseline: "central",
                                fontSize: 17,
                                fontFamily: "Courier New"})
                            .disableTextSelection();
                        const preview = () => rect.withAttribute("stroke-width", 1.5);
                        const normal = () => rect.withAttribute("stroke-width", 1);
                        const active = () => rect.withAttribute("stroke-width", 2);
                        const eventListeners = Module.of(() => {
                            let isMouseOver = false,
                                isMouseDown = false,
                                mouseUpHandler = undefined;
                            mouseUpHandler = function () {
                                isMouseDown = false;
                                window.removeEventListener("mouseup", mouseUpHandler);
                                Functions.ifThenElse(isMouseOver,
                                    () => {
                                        preview();
                                        clickHandler();},
                                    () => normal());};
                            return {
                                mouseEnter: () => {
                                    isMouseOver = true;
                                    Functions.ifThenElse(isMouseDown,
                                        active,
                                        preview);},
                                mouseDown: (e) => Functions.ifThen(
                                    e.button === 0,
                                    () => {
                                        isMouseDown = true;
                                        window.addEventListener("mouseup", mouseUpHandler);
                                        active();}),
                                mouseLeave: () => {
                                    isMouseOver = false;
                                    normal();}};});
                        rect = SVG.Builder.Rect
                            .withX(0).withY(0)
                            .withWidth(width).withHeight(height)
                            .withClass("text-button-outline")
                            .withAttributes({});
                        return SVG.Builder.G()
                            .withClass("text-button")
                            .moveTo(x, y)
                            .withChild(label)
                            .withChild(rect)
                            .withGetter("label", () => label)
                            .withGetter("rect", () => rect)
                            .withMethods(Module.of((enabled=false) => ({
                                enable: function() {
                                    if(enabled === true) {
                                        return;}
                                    enabled = true;
                                    this.withAttributes({
                                        pointerEvents: "all",
                                        cursor: "pointer"
                                    });
                                    label.withoutAttribute("text-decoration");
                                    this.withEventListeners(eventListeners);},
                                enabled: function() {
                                    this.enable();
                                    return this;},
                                disable: function() {
                                    if(enabled === false) {
                                        return;}
                                    enabled = false;
                                    this.withAttributes({
                                        cursor: "not-allowed"});
                                    label.withAttribute("text-decoration", "line-through");
                                    this.withoutEventListeners(eventListeners); },
                                disabled: function() {
                                    this.disable();
                                    return this;}})))
                            .enabled();}})})};
        svgBuilder.MouseTrap = {
            withX: x => ({
                withY: y => ({
                    withWidth: width => ({
                        withHeight: height => svgBuilder.Rect
                            .withX(x)
                            .withY(y)
                            .withWidth(width)
                            .withHeight(height)
                            .withAttributes({
                                pointerEvents: "fill",
                                cursor: "pointer",
                                fill: "none",
                                stroke: "none"})})})})};
        svgBuilder.Modal = Module.of((
            fillOpacity=.95,
            contentPadding=10
        ) => ({
            withContent: content => ({
                withContentSize: (width, height) => {
                    let modal = undefined;
                    let onCloseCallback = null;
                    modal = SVG.Builder.G()
                        .withClass("modal")
                        .withChild(SVG.Builder.MouseTrap
                            .withX(0)
                            .withY(0)
                            .withWidth(Style.width)
                            .withHeight(Style.height)
                            .withClass("modal-backdrop")
                            .withAttributes({
                                fill: Style.colors.black,
                                fillOpacity: fillOpacity})
                            .withEventListener("mousedown", () => modal.close()))
                        .withChild(SVG.Builder.G()
                            .withClass("modal-content-container")
                            .moveTo(.5 * (Style.width - width), .5 * (Style.height - height))
                            .withChild(SVG.Builder.Rect
                                .withX(-contentPadding)
                                .withY(-contentPadding)
                                .withWidth(width + 2 * contentPadding)
                                .withHeight(height + 2 * contentPadding)
                                .withClass("modal-content-container-background")
                                .withAttribute("fill", Style.colors.white))
                            .withChild(content))
                        .withMethod("close", function(){
                            this.parentElement.removeChild(modal);
                            if(onCloseCallback !== null) {
                                onCloseCallback();}})
                        .withSetter("onclose", function(callback) {
                            onCloseCallback = callback; })
                        .withMethod("withCloseCallback", function(callback) {
                            this.onclose = callback;
                            return this;})
                    return modal;}})}));
        return {Builder: svgBuilder};});

    //A shape defines the sounding of a guitar as an array of six string actions called its schema.
    //
    //String actions come in the following varieties:
    //  • Unsounded means the string is unfingered and unplucked.
    //  • Open means the string is unfingered and plucked.
    //  • Fingered means the string is fingered on a fret and plucked to create a sounded note
    //  • Deadened means the string is fingered on a fret and plucked, but without sounding a note
    //
    //The frets of a shape are numbered relative to a variable 'root fret', which is the lowest fret of a Shape's
    //fingered or deadened string actions, or 1 if a shape has no fingered or deadened string actions.
    //
    //Shapes are defined with a fret range ∈ {(a,b)|1<=a<=b<=11}
    //
    //A chord is a shape with a fixed root fret.
    const Shapes = Module.of(() => {
        const StringAction = Module.of(() => {
            const StringAction = {
                any: "*",
                unsounded: "",
                open: "o",
                dead: "x",
                fingered: (fret, finger) => ({
                    sounded: true,
                    fret: fret,
                    finger: finger }),
                deadened: (fret, finger) => ({
                    sounded: false,
                    fret: fret,
                    finger: finger }),
                fromString: (string) =>
                    string === StringAction.unsounded ?
                        StringAction.unsounded :
                        string === StringAction.open ?
                            StringAction.open :
                            string.charAt(0) === StringAction.dead ?
                                StringAction.deadened(
                                    Number.parseInt(string.charAt(1)),
                                    string.charAt(2)) :
                                StringAction.fingered(
                                    Number.parseInt(string.charAt(0)),
                                    string.charAt(1)),
                toString: (stringAction) =>
                    [StringAction.unsounded, StringAction.open, StringAction.any].includes(stringAction) ?
                        stringAction :
                        stringAction.sounded ?
                            `${stringAction.fret}${stringAction.finger}` :
                            `x${stringAction.fret}${stringAction.finger}`,
                isFingerless: stringAction => [StringAction.any, StringAction.unsounded, StringAction.open].includes(stringAction)};
            StringAction.isFingered = (stringAction) => ! StringAction.isFingerless(stringAction);
            StringAction.isDeadened = (stringAction) =>
                StringAction.isFingered(stringAction) && ! stringAction.sounded;
            StringAction.equals = (a, b) => StringAction.toString(a) === StringAction.toString(b);
            StringAction.matches = (stringAction, search) =>
                search === StringAction.any ||
                StringAction.equals(stringAction, search) || (
                StringAction.isFingered(search) &&
                search.finger === Fingers.any &&
                StringAction.isFingered(stringAction) &&
                stringAction.sounded === search.sounded &&
                stringAction.fret === search.fret);
            return StringAction;});
        const FingerAction = {
            Builder: {
                withFinger: (finger) => ({
                    atRootFret: (fret) => ({
                        fromString: (fromString) => ({
                            toString: (toString) => ({
                                finger: finger,
                                fret: fret,
                                range: Strings.range(fromString, toString)})})})})},
            Validations: {
                lacksRootFret: fingerActions => ! fingerActions.some(fingerAction =>
                    fingerAction.fret === Frets.roots.first),
                usesAFingerMoreThanOnce: fingerActions => Object.values(
                    fingerActions.reduce(
                        (numPerFinger, fingerAction) => {
                            undefined === numPerFinger[fingerAction.finger] ?
                                numPerFinger[fingerAction.finger] = 1 :
                                ++numPerFinger[fingerAction.finger];
                            return numPerFinger;},
                        {}))
                    .some(count => count > 1),
                hasFingersCrossedOnAFret: (fingerActions) => Object
                    .values(fingerActions
                        .map(fingerAction => ({
                            fret: fingerAction.fret,
                            fingerOrder: fingerAction.finger === Fingers.thumb ?
                                0 : Number.parseInt(fingerAction.finger)}))
                        .reduce(
                            (fingersOnFret, fingerAction) => {
                                undefined === fingersOnFret[fingerAction.fret] ?
                                    fingersOnFret[fingerAction.fret] = [fingerAction.fingerOrder] :
                                    fingersOnFret[fingerAction.fret].push(fingerAction.fingerOrder);
                                return fingersOnFret; },
                            {}))
                    .some(fingersOnFret => {
                        let previousFinger = undefined;
                        return fingersOnFret.some(finger => {
                            const outOfOrder = finger < previousFinger;
                            previousFinger = finger;
                            return outOfOrder;});})}};
        const Schema = Module.of(() => {
            const Schema = {
                fromString: string => string.split(",").map(StringAction.fromString),
                toString: schema => schema.map(StringAction.toString).join(","),
                getFingerActions: schema => schema
                    .map((action, index) => ({
                        string: index + 1,
                        action: Shapes.StringAction.isFingerless(action) ||
                        action === Shapes.StringAction.any ? null : action}))
                    .filter(stringAction => stringAction.action !== null)
                    .reduce(Module.of(
                        ((stringActionToFingerAction = (stringAction) => FingerAction.Builder
                            .withFinger(stringAction.action.finger)
                            .atRootFret(stringAction.action.fret)
                            .fromString(stringAction.string)
                            .toString(stringAction.string)
                        ) => (fingerActions, stringAction) => fingerActions.length === 0 ?
                            [stringActionToFingerAction(stringAction)] :
                            Module.of((lastRelevantStringAction = Arrays.findLast(
                                schema.slice(0, stringAction.string - 1),
                                candidate => Shapes.StringAction.isFingerless(candidate) ||
                                    candidate.fret <= stringAction.action.fret)) =>
                                lastRelevantStringAction === undefined ||
                                Shapes.StringAction.isFingerless(lastRelevantStringAction) ||
                                lastRelevantStringAction.finger !== stringAction.action.finger ||
                                lastRelevantStringAction.finger === Fingers.any
                                    ?
                                    fingerActions.concat(stringActionToFingerAction(stringAction)) :
                                    Arrays.updateItem(
                                        fingerActions,
                                        Arrays.lastIndexOf(fingerActions,
                                            (fingerAction) => fingerAction.finger === stringAction.action.finger),
                                        (fingerAction) => fingerAction.range.max = stringAction.string)))),
                        [])};
            Schema.allUnsounded = Numbers.range(0, Strings.count).map(() => StringAction.unsounded);
            Schema.allAnyStringAction = Numbers.range(0, Strings.count).map(() => StringAction.any);
            Schema.equals = (a, b) => Schema.toString(a) === Schema.toString(b);
            return Schema; });
        return Module.of(() => {
            const Builder = Module.of((
                withSchemaStep=id=>({
                    withSchema: schema => ({
                        withRange: range => ({
                            id: id,
                            schema: schema,
                            range: range})})})
            ) => ({
                withId: withSchemaStep,
                withoutId: () => withSchemaStep(null)}));
            const shapesFromString = (string) => string.length === 0 ? [] :
                string.split(/\r?\n/).map((line, lineIndex) => {
                    const lineProperties = line.split(";");
                    return Builder
                        .withId(lineIndex)
                        .withSchema(Schema.fromString(lineProperties[0]))
                        .withRange(Module.of(() => {
                            const rangeComponents = lineProperties[1].split(",");
                            return Frets.Range.create(
                                Number.parseInt(rangeComponents[0]),
                                Number.parseInt(rangeComponents[1]));})); });
            const shapesToString = (shapes) => shapes.length === 0 ? "" : shapes
                .map(shape =>
                    Schema.toString(shape.schema) + ";" +
                    shape.range.min + "," + shape.range.max)
                .join("\r\n");
            const localStorageKey = "chord-jog-shapes";
            const all = Module.of(() => {
                const shapeString = localStorage.getItem(localStorageKey);
                return shapeString === null || shapeString.length === 0 ?
                    [] : shapesFromString(shapeString);});
            const saveToLocalStorage = () => localStorage.setItem(
                localStorageKey,
                shapesToString(all));
            return {
                StringAction: StringAction,
                FingerAction: FingerAction,
                Schema: Schema,
                Builder: Builder,
                all: all,
                equals: (a, b) => Schema.equals(a.schema, b.schema) && Frets.Range.equals(a.range, b.range),
                existsWithSchema: (schema) => all.some(shape =>
                    Schema.equals(shape.schema, schema)),
                add: shape => {
                    shape.id = all.length;
                    all.push(shape);
                    saveToLocalStorage();},
                fromString: shapesFromString,
                toString: shapesToString,
                search: schemaQuery => all.filter(shape =>undefined === shape.schema.find((stringAction, index) =>
                    Module.of((
                        stringActionQuery=schemaQuery[index]
                    ) => ! StringAction.matches(stringAction, stringActionQuery))))};});});

    const ShapeChart = Module.of(() => {
        const halfRoot2 = .5 * Math.SQRT2;
        const FingerlessIndicator = Module.of((
            FingerlessIndicatorStyle = Module.of((radius=5, margin=2) => ({
                radius: radius,
                diameter: 2 * radius,
                margin: margin}))
        ) => ({
            Style: FingerlessIndicatorStyle,
            Builder: Module.of((
                AnyStringActionBuilder = Module.of((textYOffset=2) => ({
                    withCenter: center => SVG.Builder.Text
                        .withTextContent("*")
                        .withClass("any-action-indicator")
                        .withAttributes({
                            fontFamily: "Courier New",
                            fontSize: 14,
                            dominantBaseline: "central",
                            textAnchor: "middle"})
                        .moveTo(center[0], center[1] + textYOffset)})),
                DeadStringBuilder = {
                    withCenter: center => SVG.Builder.Path
                        .withD(
                            `M
                                ${center[0] - FingerlessIndicatorStyle.radius * halfRoot2},
                                ${center[1] - FingerlessIndicatorStyle.radius * halfRoot2}
                            l
                                ${FingerlessIndicatorStyle.diameter * halfRoot2},
                                ${FingerlessIndicatorStyle.diameter * halfRoot2}
                            m
                                0,
                                ${-FingerlessIndicatorStyle.diameter * halfRoot2}
                            l
                                ${-FingerlessIndicatorStyle.diameter * halfRoot2},
                                ${FingerlessIndicatorStyle.diameter * halfRoot2}`)
                        .withClass("dead-string-indicator")},
                OpenStringBuilder = {
                    withCenter: center => SVG.Builder.Circle
                        .withCenter(center)
                        .withRadius(FingerlessIndicatorStyle.radius)
                        .withClass("open-string-indicator")},
                maxActiveRelativeFretToCenterBottomY=maxActiveRelativeFret=>
                    Fretboard.fretToYCoordinate(
                        (maxActiveRelativeFret === undefined ? 0 : maxActiveRelativeFret) + .5) +
                    FingerlessIndicatorStyle.radius + FingerlessIndicatorStyle.margin
            ) => ({
                forString: (string) => Module.of((
                    centerX = FingerlessIndicatorStyle.startX + ((string - 1) * Fretboard.Style.stringSpacing),
                    centerTop = [
                        centerX,
                        FingerlessIndicatorStyle.startY + FingerlessIndicatorStyle.radius]
                ) => ({
                    topOnly: {
                        any: () => AnyStringActionBuilder.withCenter(centerTop),
                        dead: () => DeadStringBuilder.withCenter(centerTop),
                        open: () => OpenStringBuilder.withCenter(centerTop)},
                    topAndBottom: ({
                        withMaxActiveRelativeFret: maxActiveRelativeFret => Module.of((
                            centerBottom = [
                                centerX,
                                maxActiveRelativeFretToCenterBottomY(maxActiveRelativeFret)]
                        ) => ({
                            any: () => SVG.Builder.G()
                                .withClass("any-string-indicators")
                                .withChild(AnyStringActionBuilder.withCenter(centerTop))
                                .withChild(AnyStringActionBuilder.withCenter(centerBottom)),
                            dead: () => SVG.Builder.G()
                                .withClass("dead-string-indicators")
                                .withChild(DeadStringBuilder.withCenter(centerTop))
                                .withChild(DeadStringBuilder.withCenter(centerBottom)),
                            open: () => SVG.Builder.G()
                                .withClass("open-string-indicators")
                                .withChild(OpenStringBuilder.withCenter(centerTop))
                                .withChild(OpenStringBuilder.withCenter(centerBottom))}))}),
                    bottomOnly: ({
                        withMaxActiveRelativeFret: maxActiveRelativeFret => Module.of((
                            centerBottom = [
                                centerX,
                                maxActiveRelativeFretToCenterBottomY(maxActiveRelativeFret)]
                        ) => ({
                            any: () => AnyStringActionBuilder.withCenter(centerBottom),
                            dead: () => DeadStringBuilder.withCenter(centerBottom),
                            open: () => OpenStringBuilder.withCenter(centerBottom)}))})}))}))}));
        const RootFretLabel = {
            Style: {
                paddingRight: 5,
                textLength: 18, //hardcoded
                fontSize: 15,
                fontFamily: "monospace" }};
        const FingerIndicator = Module.of((radius=11) => ({
            Style: {
                font: "Helvetica",
                radius: radius,
                diameter: 2*radius,
                anyFingerTextYOffset: 3}}));
        const ShapeChartStyle = {
            padding: {
                x: RootFretLabel.Style.textLength +
                    RootFretLabel.Style.paddingRight +
                    FingerIndicator.Style.radius,
                y: Style.stroke.halfWidth + FingerlessIndicator.Style.radius } };
        FingerlessIndicator.Style.startX = ShapeChartStyle.padding.x;
        FingerlessIndicator.Style.startY = ShapeChartStyle.padding.y;
        const Fretboard = {
            Style: {
                stringSpacing: 25,
                fretHeight: 29.5,
                startX: ShapeChartStyle.padding.x,
                startY: FingerlessIndicator.Style.startY +
                    FingerlessIndicator.Style.diameter +
                    FingerlessIndicator.Style.margin },
            stringToXCoordinate: (string) => Fretboard.Style.startX + (string - 1) * Fretboard.Style.stringSpacing,
            fretToYCoordinate: (fret) => Fretboard.Style.startY + (fret -.5) * Fretboard.Style.fretHeight};
        Fretboard.Style.width = Fretboard.Style.stringSpacing * (Strings.count - 1);
        Fretboard.Style.height = Fretboard.Style.fretHeight * Frets.Relative.count;
        Fretboard.stringFretToXY = (string, fret) => [
            Fretboard.stringToXCoordinate(string),
            Fretboard.fretToYCoordinate(fret)];
        Fretboard.StringLineBuilder =  {
            forString: (string) => ({
                toFret: (fret) => SVG.Builder.Line
                    .withEndpoints(
                        Fretboard.stringFretToXY(string, Frets.Relative.first - .5),
                        Fretboard.stringFretToXY(string, fret + .5))
                    .withClass("string-line")
                    .withDataAttribute("string", string)})};
        Fretboard.FretDividerBuilder = {
            belowFret: (belowFret = Frets.Relative.last + 1) => ({
                fromString: (fromString) => ({
                    toString: (toString) => SVG.Builder.Line
                        .withEndpoints(
                            Fretboard.stringFretToXY(fromString, belowFret - .5),
                            Fretboard.stringFretToXY(toString, belowFret - .5))
                        .withClass("fret-separator")
                        .withDataAttribute("aboveFret", belowFret - 1)
                        .withDataAttribute("belowFret", belowFret)})})};
        FingerIndicator.Builder = {
            forFingerAction: (fingerAction) => SVG.Builder
                .G()
                .withClass("finger-indicator")
                .withDataAttributes({
                    finger: fingerAction.finger,
                    fret: fingerAction.fret,
                    minString: fingerAction.range.min,
                    maxString: fingerAction.range.max})
                .withAttribute("stroke", Style.colors.superHeavy)
                .withChild(SVG.Builder.Rect
                    .withX(Fretboard.stringToXCoordinate(fingerAction.range.min) - FingerIndicator.Style.radius)
                    .withY(Fretboard.fretToYCoordinate(fingerAction.fret) - FingerIndicator.Style.radius)
                    .withWidth(FingerIndicator.Style.diameter +
                        Fretboard.Style.stringSpacing * (fingerAction.range.max - fingerAction.range.min))
                    .withHeight(FingerIndicator.Style.diameter)
                    .withRadius(FingerIndicator.Style.radius)
                    .withClass("finger-indicator-outline")
                    .withAttribute("fill", Style.colors.superHeavy))
                .withChild(SVG.Builder.Text
                    .withTextContent(fingerAction.finger)
                    .withAttributes({
                        x: Module.of(() => {
                            const min = Fretboard.stringToXCoordinate(fingerAction.range.min);
                            return min + .5 * (Fretboard.stringToXCoordinate(fingerAction.range.max) - min);}),
                        y: Fretboard.fretToYCoordinate(fingerAction.fret) + (
                            fingerAction.finger === Fingers.any ?
                                FingerIndicator.Style.anyFingerTextYOffset :
                                0),
                        fontFamily: FingerIndicator.Style.font,
                        dominantBaseline: "central",
                        textAnchor: "middle",
                        stroke: "none",
                        fill: Style.colors.superLight,
                        fontSize: 17}))};
        RootFretLabel.Builder = Module.of(() => {
            const rootFretToLabel = (rootFret) =>
                rootFret === undefined ? "" :
                    rootFret === null ? "r" : rootFret;
            const forRootFret = (rootFret) => {
                const text = rootFretToLabel(rootFret);
                const label = SVG.Builder.Text
                    .withoutTextContent(text)
                    .withClass("root-fret-label")
                    .moveTo(
                        Fretboard.stringToXCoordinate(1) -
                        FingerIndicator.Style.radius -
                        RootFretLabel.Style.paddingRight,
                        Fretboard.fretToYCoordinate(Frets.Relative.first))
                    .withSetter("rootFret", function(rootFret) {
                        this.withTextContent(rootFretToLabel(rootFret));})
                    .withAttributes({
                        dominantBaseline: "central",
                        textAnchor: "end",
                        fontFamily: RootFretLabel.Style.fontFamily,
                        fontSize: RootFretLabel.Style.fontSize})
                    .withTextLength(RootFretLabel.Style.textLength)
                    .withLengthAdjustSpacing();
                return text.length <= 1 ? label : label
                    .withTextLength(17); };
            return {
                fixed: fret => forRootFret(fret),
                unfixed: () => forRootFret(null)}; });

        //The 'skeleton' consists of the passive portion of the ShapeChart -
        //fretboard and finger indicator placeholders.
        const SkeletonBuilder = Module.of((
            createSkeleton=() => SVG.Builder.G()
                .withClass("shape-chart-skeleton")
                .withAttribute("stroke", Style.colors.light)
                .withChild(SVG.Builder.G()
                    .withClass("fingerless-indicators")
                    .withChildren(Strings.all
                        .map(string => FingerlessIndicator.Builder.forString(string).topOnly)
                        .map(fingerIndicatorBuilder => [
                            fingerIndicatorBuilder.open(),
                            fingerIndicatorBuilder.dead()])
                        .flat()))
                .withChild(SVG.Builder.G()
                    .withClass("fretboard")
                    .withChildren(Strings.all.map(string => Fretboard.StringLineBuilder
                        .forString(string)
                        .toFret(Frets.Relative.last)))
                    .withChildren(Numbers.range(Frets.Relative.first, Frets.Relative.last + 2)
                        .map(belowFret => Fretboard.FretDividerBuilder
                            .belowFret(belowFret)
                            .fromString(Strings.first)
                            .toString(Strings.last))))
        ) => ({
            withAnyStringAction: () => createSkeleton()
                .withChild(SVG.Builder.G()
                    .withClass("any-string-action-indicators")
                    .withChildren(Strings.all
                        .map(string => FingerlessIndicator.Builder
                            .forString(string)
                            .bottomOnly
                            .withMaxActiveRelativeFret(Frets.Relative.max)
                            .any()))),
            withoutAnyStringAction: () => createSkeleton()}));

        //The 'meat' consists of the active portion of the ShapeChart -
        // darkened fretboard strings and finger indicators.
        const MeatBuilder = {
            forSchema: (schema) => {
                const fingeredStringActions = schema.filter(Shapes.StringAction.isFingered);
                const nonUnsoundedStringActions = schema
                    .map((action, index) => ({
                        string: index + 1,
                        action: action}))
                    .filter(stringAction => stringAction.action !== Shapes.StringAction.unsounded);
                const anyStringActions = nonUnsoundedStringActions.filter(stringAction =>
                    stringAction.action === Shapes.StringAction.any);
                const maxFret = anyStringActions.length > 0 ?
                    Frets.Relative.max :
                    fingeredStringActions.length === 0 ?
                        undefined :
                        fingeredStringActions
                            .map(stringAction => stringAction.fret)
                            .reduce((a, b) => a >= b ? a : b);
                const meat = SVG.Builder
                    .G()
                    .withAttribute("stroke", Style.colors.heavy)
                    .withClass("shape-chart-meat");
                if(maxFret !== undefined) {meat
                    //Active strings
                    .withChildren(nonUnsoundedStringActions
                        .map(stringAction => Fretboard.StringLineBuilder
                            .forString(stringAction.string)
                            .toFret(maxFret)
                            .withAttribute("strokeWidth", 1.5)))
                    //Active frets dividers
                    .withChildren(Numbers.range(Frets.Relative.first, maxFret + 2).map(belowFret =>
                        Fretboard.FretDividerBuilder
                            .belowFret(belowFret)
                            .fromString(nonUnsoundedStringActions[0].string)
                            .toString(nonUnsoundedStringActions[nonUnsoundedStringActions.length-1].string)
                            .withAttribute("strokeWidth", 1.5)))}
                return nonUnsoundedStringActions.length === 0 ? meat : meat
                    //Any string action indicators
                    .withChildren(anyStringActions.map(stringAction =>
                        FingerlessIndicator.Builder
                            .forString(stringAction.string)
                            .bottomOnly
                            .withMaxActiveRelativeFret(maxFret)
                            .any()
                            .withAttribute("stroke", Style.colors.black)))
                    //Open strings indicators
                    .withChildren(nonUnsoundedStringActions
                        .filter(stringAction => stringAction.action === Shapes.StringAction.open)
                        .map(stringAction => FingerlessIndicator.Builder
                            .forString(stringAction.string)
                            .topAndBottom
                            .withMaxActiveRelativeFret(maxFret)
                            .open()
                            .withAttribute("stroke", Style.colors.black)))
                    //Dead strings indicators
                    .withChildren(nonUnsoundedStringActions
                        .filter(stringAction => Shapes.StringAction.isDeadened(stringAction.action))
                        .map(stringAction => stringAction.string)
                        .map(deadString => FingerlessIndicator.Builder
                            .forString(deadString)
                            .topAndBottom
                            .withMaxActiveRelativeFret(maxFret)
                            .dead()
                            .withAttribute("stroke", Style.colors.black)))
                    //Finger indicators
                    .withChildren(Shapes.Schema.getFingerActions(schema)
                        .map(fingerAction => FingerIndicator.Builder.forFingerAction(fingerAction)))}};
        return {
            Style: {
                width: Fretboard.Style.startX +
                    Fretboard.Style.width +
                    FingerIndicator.Style.radius,
                height: Fretboard.Style.startY + Fretboard.Style.height + FingerlessIndicator.Style.diameter},
            MeatBuilder: MeatBuilder,
            Fretboard: {
                Style: {
                    x: Fretboard.Style.startX,
                    y: Fretboard.Style.startY,
                    stringSpacing: Fretboard.Style.stringSpacing,
                    fretHeight: Fretboard.Style.fretHeight,
                    width: Fretboard.Style.width,
                    height: Fretboard.Style.height}},
            FingerIndicator: {
                Style: FingerIndicator.Style},
            FingerlessIndicator: {
                Style: FingerlessIndicator.Style},
            Builder: Module.of((
                buildStep = (schema, rootFret, includeAnyStringAction) => Module.of((
                    shapeChartMeat = MeatBuilder.forSchema(schema),
                    rootFretLabel = rootFret === null ?
                        RootFretLabel.Builder.unfixed() :
                        RootFretLabel.Builder.fixed(rootFret),
                    Schema = Module.of((value) => ({
                        get: () => value,
                        set: schema => {
                            value = schema;
                            const newMeat = MeatBuilder.forSchema(value);
                            shapeChartMeat.replaceWith(newMeat);
                            shapeChartMeat = newMeat; }})),
                    RootFret = Module.of((value) => ({
                        get: () => value,
                        set: (rootFret) => {
                            value = rootFret;
                            rootFretLabel.rootFret = value;}}))
                ) => SVG.Builder.G()
                    .withClass("shape-chart")
                    .disableTextSelection()
                    .withChild(includeAnyStringAction === true ?
                        SkeletonBuilder.withAnyStringAction() :
                        SkeletonBuilder.withoutAnyStringAction())
                    .withChild(shapeChartMeat)
                    .withChild(rootFretLabel)
                    .withGetterAndSetter("schema",
                        Schema.get,
                        Schema.set)
                    .withMethod("withSchema", function(schema) {
                        this.schema = schema;
                        return this; })
                    .withSchema(schema)
                    .withGetterAndSetter("rootFret",
                        RootFret.get,
                        (value) => RootFret.set(value))
                    .withMethod("withRootFret", function(rootFret) {
                        this.rootFret = rootFret;
                        return this;})
                    .withRootFret(rootFret)),
                anyStringActionStep = (schema, rootFret) => ({
                    withAnyStringAction: () => buildStep(schema, rootFret, true),
                    withoutAnyStringAction: () => buildStep(schema, rootFret, false)}),
                rootFretStep = (schema) => ({
                    fixed: rootFret => anyStringActionStep(schema, rootFret),
                    unfixed: () => anyStringActionStep(schema, null)})
            ) => ({
                blank: () => rootFretStep(Shapes.Schema.allUnsounded),
                forSchema: schema => rootFretStep(schema)}))};});

    const FingerInput = Module.of((
        FingerInputStyle={
            //hardcoded
            baseWidth: 237,
            baseHeight: 292,
            strokeWidth: 2,
            scale: .5}
    ) => ({
        Style: {
            width: FingerInputStyle.scale * FingerInputStyle.baseWidth,
            height: FingerInputStyle.scale * FingerInputStyle.baseHeight},
        Builder: Module.of((
            RegionsBuilder = Module.of((
                StaticRegions = Module.of((
                    StaticRegionBuilder= Module.of(() => ({
                        withValue: (value) => ({
                            withPosition: (position) => ({
                                withTextOffset: (textOffset) => Module.of((region={
                                    value: value,
                                    position: position,
                                    textOffset: textOffset}
                                ) => ({
                                    withPointModel: (p) => {
                                        region.joints = [p];
                                        return region;},
                                    withLineSegmentModel: (lineSegment) => {
                                        region.joints = lineSegment;
                                        return region; }}))})})})),
                    fingerRegions = [
                        StaticRegionBuilder
                            .withValue(Fingers.thumb)
                            .withPosition([37.8, 188])
                            .withTextOffset([-.5, -.5])
                            .withLineSegmentModel([[11, 137],[48, 209]]),
                        StaticRegionBuilder
                            .withValue(Fingers.index)
                            .withPosition([91, 110])
                            .withTextOffset([.5, -.5])
                            .withLineSegmentModel([[82, 25], [94, 141]]),
                        StaticRegionBuilder
                            .withValue(Fingers.middle)
                            .withPosition([135.75, 94])
                            .withTextOffset([0, -.5])
                            .withLineSegmentModel([[131, 7], [139, 133]]),
                        StaticRegionBuilder
                            .withValue(Fingers.ring)
                            .withPosition([177.5, 104])
                            .withTextOffset([-1, 0])
                            .withLineSegmentModel([[181, 29], [175, 141]]),
                        StaticRegionBuilder
                            .withValue(Fingers.pinky)
                            .withPosition([217.3, 130])
                            .withTextOffset([-1.75, -1])
                            .withLineSegmentModel([[219, 63], [217, 158]])],
                    anyFingerRegion=StaticRegionBuilder
                        .withValue(Fingers.any)
                        .withPosition([145, 225])
                        .withTextOffset([0, 4.5])
                        .withPointModel([150, 230]),
                    allRegions=fingerRegions.concat(anyFingerRegion)
                ) => ({
                    fingers: fingerRegions,
                    all: allRegions})),
                RegionLabelBuilder = {
                    forStaticRegion: (staticRegion) => SVG.Builder.Text
                        .withTextContent(staticRegion.value)
                        .withClass("finger-label")
                        .withAttributes({
                            x: staticRegion.position[0],
                            y: staticRegion.position[1],
                            fontFamily: "Courier New",
                            fontSize: 37,
                            dx: -10.5 + staticRegion.textOffset[0],
                            dy: 10.5 + staticRegion.textOffset[1]})},
                RegionJointsBuilder = Module.of((
                    pointToJoint = (point) => SVG.Builder.Circle
                        .withCenter(point)
                        .withRadius(1)
                        .withClass("finger-input-region-joint")
                        .withGetter("position", () => point)
                        .hide()
                ) => ({
                    forStaticRegion: staticRegion => staticRegion.joints.map(pointToJoint)})),
                RegionBuilder={
                    forStaticRegion: staticRegion =>  Module.of((
                        joints = RegionJointsBuilder.forStaticRegion(staticRegion)
                    ) => SVG.Builder.G()
                        .withClass("finger-region")
                        .withChild(RegionLabelBuilder.forStaticRegion(staticRegion))
                        .withChild(SVG.Builder.G()
                            .withClass("finger-region-joints")
                            .withChildren(joints))
                        .withGetter("value", () => staticRegion.value)
                        .withGetter("position", () => staticRegion.position)
                        .withMethod("distance2", joints.length === 1 ?
                            (p) => Geometry.distance2(p, joints[0].position) :
                            (p) => Geometry.distance2(p,
                                Geometry.projectPointOnLineSegment(p,
                                    joints.map(joint => joint.position)))))},
                RegionsBuilder = {
                    forStaticRegions: staticRegions => staticRegions.map(RegionBuilder.forStaticRegion)}
            ) => ({
                fingers: () => RegionsBuilder.forStaticRegions(StaticRegions.fingers),
                all: () => RegionsBuilder.forStaticRegions(StaticRegions.all)})),
            FingerInputBuilder = Module.of((
                RegionIndicatorBuilder = Module.of((
                    radius=18,
                    previewStrokeDasharray="4 5",
                    createIndicator = () => Module.of((region=null) => SVG.Builder.Circle
                        .withoutCenter()
                        .withRadius(radius)
                        .withGetterAndSetter("region",
                            () => region,
                            function(newRegion) {
                                //Is the new region the same as the old region?
                                if(newRegion === region) {
                                    //Yes. Do nothing.
                                    return;}
                                //Is the new region something?
                                if(newRegion !== null) {
                                    //Yes. Update the position.
                                    this.center = newRegion.position;
                                    //Is the old region nothing?
                                    if(region === null) {
                                        //Yes. Show the indicator.
                                        this.show();}}
                                    //The new region is nothing.
                                //Is the old region something?
                                else if(region !== null) {
                                    //Yes. Hide the indicator.
                                    this.hide();}
                                //Finally, update the region.
                                region = newRegion;})
                        .withMethod("forRegion", function(region) {
                            this.region = region;
                            return this;}))
                ) => ({
                    selected: {
                        withInitialRegion: initialRegion => createIndicator()
                            .forRegion(initialRegion)},
                    preview: () => createIndicator()
                        .withAttribute("stroke-dasharray", previewStrokeDasharray)
                        .hide()})),
            ) => ({
                withRegions: regions => Module.of((
                    regionByValue=(value) => regions.find(region => region.value === value),
                    mouseEventToClosestRegionValue = (e) => regions
                        .map(region => ({
                            value: region.value,
                            distance2: region.distance2([e.offsetX, e.offsetY])}))
                        .reduce((closestRegion, currentRegion) =>
                            closestRegion.distance2 <= currentRegion.distance2 ?
                                closestRegion : currentRegion)
                        .value
                ) => ({
                    withInitialValue: initialValue => ({
                        withKeyValueMap: keyValueMap => Module.of((
                            selectedIndicator=RegionIndicatorBuilder
                                .selected
                                .withInitialRegion(regionByValue(initialValue)),
                            Selected=Module.of((changeListener=undefined) => ({
                                get: () => selectedIndicator.region.value,
                                set: selected => {
                                    if(selected !== selectedIndicator.region.value) {
                                        selectedIndicator.region = regionByValue(selected);
                                        if(changeListener !== undefined) {
                                            changeListener(selected);}}},
                                setChangeListener: listener => changeListener = listener})),
                            previewIndicator=RegionIndicatorBuilder.preview(),
                            Preview = {
                                get: () => previewIndicator.region.value,
                                set: preview => previewIndicator.region = preview !== null ?
                                    regionByValue(preview) :
                                    null},
                        ) => SVG.Builder.G()
                            .withClass("finger-input")
                            .withChild(SVG.Builder.Path //hand-outline
                                .withD(
                                    `M
                                    90.24086,	287.90208
                                C
                                    65.553543,	278.2203
                                    58.735661,	267.8963
                                    44.888627,	249.27999
                            
                                    41.477532,	244.69408
                                    31.698887,	231.03142
                                    29.347764,	224.59326
                            
                                    27.055052,	214.83116
                                    25.07621,	205.17052
                                    22.760006,	198.50736
                            
                                    20.885747,	193.11564
                                    14.138771,	180.79899
                                    12.027004,	174.7266
                            
                                    10.37836,	169.98589
                                    10.255809,	162.7399
                                    8.2089209,	155.89701
                            
                                    6.8990141,	151.51793
                                    5.4228811,	145.45277
                                    1.4765024,	135.88287
                                c
                                    -2.8811867,	-6.98685
                                    5.8594728,	-11.25498
                                    18.1170216,	-5.80672
                            
                                    10.822529,	4.81044
                                    12.906949,	8.67208
                                    17.992632,	15.02954
                            
                                    4.381971,	5.47776
                                    11.338612,	33.54161
                                    22.276197,	41.0769
                            
                                    1.759648,	1.21229
                                    3.823847,	-0.1425
                                    3.823847,	-0.1425
                            
                                    3.403311,	-9.60373
                                    12.928881,	-18.62113
                                    12.156321,	-50.01484
                                C
                                    75.591525,		125.82638
                                    74.091922,		108.61179
                                    72.695207,		93.170149
                            
                                    72.187304,		87.554666
                                    71.917408,		76.230509
                                    71.60716,		70.018286
                            
                                    71.27307,		63.328224
                                    69.998647,		52.954412
                                    69.976007,		48.065245
                                c
                                    -0.02475,		-5.335972
                                    -0.09676,		-15.052854
                                    1.293281,		-23.298712
                            
                                    1.834863,		-10.884309
                                    17.963013,		-10.117052
                                    20.891868,		-2.365259
                            
                                    2.804369,		11.617646
                                    3.238162,		18.094071
                                    4.170184,		23.550833
                            
                                    1.18185,		6.919363
                                    2.16547,		15.427318
                                    3.194578,		20.506386
                            
                                    1.032022,		5.093395
                                    3.237512,		14.515669
                                    5.231872,		24.123065
                            
                                    2.63942,		8.691535
                                    3.12635,		31.588042
                                    8.42702,		39.301692
                            
                                    2.45347,		3.57033
                                    3.94736,		4.93439
                                    8.42847,		5.23948
                            
                                    -0.0251,		-6.38752
                                    0.44175,		-11.31791
                                    0.094,			-15.67938
                            
                                    -0.82734,		-10.37706
                                    -2.74064,		-21.86338
                                    -3.65289,		-32.619099
                            
                                    -0.59983,		-7.071971
                                    0.13363,		-19.033253
                                    0.0713,			-23.889905
                            
                                    -0.0846,		-6.589073
                                    0.16482,		-16.634983
                                    0.0695,			-23.901209
                            
                                    -0.11196,		-8.534288
                                    -0.15176,		-29.014407
                                    2.89996,		-33.7023676
                            
                                    3.69537,		-5.67665103
                                    16.47153,		-6.09493802
                                    19.61992,		0.1074513
                            
                                    3.77308,		7.4330203
                                    5.63591,		20.4218263
                                    6.52689,		33.2823953
                            
                                    0.56858,		8.207304
                                    0.38486,		16.640813
                                    1.08551,		22.581808
                            
                                    0.87318,		7.403734
                                    2.96756,		16.415731
                                    3.89178,		25.242315
                            
                                    0.85051,		8.122744
                                    -0.31848,		21.581881
                                    0.40023,		31.949161
                            
                                    0.46752,		6.74365
                                    0.33744,		9.3262
                                    2.05853,		12.70339
                            
                                    1.07532,		2.10998
                                    5.85605,		4.02267
                                    5.85605,		4.02267
                            
                                    1.38512,		-5.27093
                                    1.49689,		-9.3538
                                    1.69222,		-15.16177
                            
                                    0.17522,		-5.20927
                                    -0.41491,		-12.58731
                                    0.0408,			-19.73849
                            
                                    0.43058,		-6.75742
                                    2.63894,		-16.998145
                                    2.85092,		-21.671145
                            
                                    0.25085,		-5.530013
                                    1.21975,		-16.805924
                                    1.43673,		-19.760198
                            
                                    0.65026,		-8.853276
                                    2.14273,		-25.591214
                                    3.09617,		-29.71769
                            
                                    2.25599,		-9.763798
                                    19.84553,		-7.945837
                                    21.60994,		0.380646
                            
                                    2.21673,		10.461034
                                    1.49518,		22.851558
                                    1.05918,		29.488952
                            
                                    -0.38092,		5.79885
                                    -0.31173,		15.701981
                                    -0.39707,		20.738562
                            
                                    -0.11832,		6.982007
                                    0.78488,		17.232073
                                    1.09147,		23.202643
                            
                                    0.26513,		5.16193
                                    -0.21878,		17.33488
                                    -0.9513,		23.07467
                            
                                    -1.77582,		13.91514
                                    0.90096,		17.44691
                                    2.30454,		21.55484
                            
                                    1.29837,		3.80005
                                    5.90152,		5.48296
                                    5.90152,		5.48296
                            
                                    0.21924,		-9.03558
                                    3.21515,		-19.80753
                                    3.57848,		-23.48812
                            
                                    0.44834,		-4.54146
                                    2.7986,			-12.15729
                                    3.5118,			-24.00093
                            
                                    0.24811,		-4.12051
                                    0.41604,		-13.362853
                                    1.30283,		-21.530475
                            
                                    0.71803,		-6.613163
                                    1.2482,			-12.945687
                                    1.95034,		-17.647274
                            
                                    2.16975,		-14.528799
                                    16.81753,		-8.521086
                                    18.04217,		-2.46042
                            
                                    0.88398,		4.374668
                                    2.01203,		17.711465
                                    2.18703,		22.654216
                            
                                    0.19566,		5.525447
                                    0.74185,		21.419513
                                    0.63958,		23.648943
                            
                                    -0.29334,		6.40311
                                    -0.59407,		20.81883
                                    -1.08627,		25.13753
                            
                                    -0.70125,		6.15295
                                    0.64604,		18.26691
                                    0.72939,		31.73454
                            
                                    0.0964,			15.58975
                                    -0.9936,		23.30861
                                    -2.21163,		33.73706
                            
                                    -8.86788,		75.92491
                                    -30.6335,		85.50484
                                    -37.94763,		87.08853
                            
                                    -8.97573,		1.94339
                                    -94.248694,		2.47411
                                    -100.724424,	-0.0632
                                z`.replace(/\s+/g, " "))
                                .withClass("hand-outline"))
                            .withChild(SVG.Builder.G()
                                .withClass("finger-regions")
                                .withChildren(regions))
                            .withChild(selectedIndicator)
                            .withChild(previewIndicator)
                            .withChild(SVG.Builder.MouseTrap
                                .withX(0)
                                .withY(0)
                                .withWidth(FingerInputStyle.baseWidth)
                                .withHeight(FingerInputStyle.baseHeight)
                                .withClass("finger-input-mouse-trap")
                                .withEventListeners({
                                    mouseMove: e => Preview.set(mouseEventToClosestRegionValue(e)),
                                    mouseDown: e => Selected.set(mouseEventToClosestRegionValue(e)),
                                    mouseLeave: () => Preview.set(null)}))
                            .withGetterAndSetter("selected", Selected.get, Selected.set)
                            .withSetter("changeListener", Selected.setChangeListener)
                            .withMethod("withChangeListener", function(listener) {
                                this.changeListener = listener;
                                return this;})
                            .withMethods(Module.of((
                                keyCommands = Object.fromEntries(
                                    Object
                                        .entries(keyValueMap)
                                        .map(keyValue => [
                                            keyValue[0],
                                            () => Selected.set(keyValue[1])]))
                            ) => ({
                                focus: () => KeyboardCommands.setAll(keyCommands),
                                focused: function() {
                                    this.focus();
                                    return this;},
                                unfocus: () => KeyboardCommands.removeAll(Object.keys(keyCommands)),
                                unfocused: function() {
                                    this.unfocus();
                                    return this;}})))
                            .scale(FingerInputStyle.scale)
                            .withAttribute("stroke-width", FingerInputStyle.strokeWidth)
                            .disableTextSelection())})}))}))
        ) => Module.of((
            fingersKeyMap={
                1: Fingers.index,
                2: Fingers.middle,
                3: Fingers.ring,
                4: Fingers.pinky,
                t: Fingers.thumb },
            allKeyMap=Object.assign({a: Fingers.any}, fingersKeyMap)
        ) => ({
            withoutWildcard: () => FingerInputBuilder
                .withRegions(RegionsBuilder.fingers())
                .withInitialValue(Fingers.index)
                .withKeyValueMap(fingersKeyMap),
            withWildcard: () => FingerInputBuilder
                .withRegions(RegionsBuilder.all())
                .withInitialValue(Fingers.any)
                .withKeyValueMap(allKeyMap)})))}));

    const ShapeInput = Module.of((shapeChartMarginRight=2) => ({
        Style: {
            width: ShapeChart.Style.width + shapeChartMarginRight + FingerInput.Style.width,
            height: ShapeChart.Style.height},
        Builder: Module.of((
            MouseTrapsBuilder = Module.of((
                MouseXToClosestStringMapperBuilder = {
                    withLeftPadding: leftPadding => mouseX => Strings.all
                        .map(string => ({
                            string: string,
                            distanceXToMouse: Math.abs(
                                mouseX -
                                leftPadding -
                                ShapeChart.Fretboard.Style.stringSpacing * (string - 1))}))
                        .reduce((a, b) => a.distanceXToMouse <= b.distanceXToMouse ? a : b)
                        .string
                },
                FingerlessIndicators = Module.of((
                    horizontalPadding=ShapeChart.FingerIndicator.Style.radius,
                    mouseXToClosestString=MouseXToClosestStringMapperBuilder
                        .withLeftPadding(horizontalPadding + ShapeChart.FingerlessIndicator.Style.radius)
                ) => ({
                    Style: {
                        padding: {
                            horizontal: horizontalPadding,
                            vertical: 7}},
                    mouseTrapStateToSchemaChange: state=>Module.of((
                        targetString = mouseXToClosestString(state.mousePosition[0]),
                        schema = Arrays.replaceItem(
                            state.schema,
                            targetString-1,
                            //Is there currently a drag action?
                            state.dragAction !== null ?
                                //Yes. Is it fingerless?
                                Shapes.StringAction.isFingerless(state.dragAction) ?
                                    //Yes. Choose it.
                                    state.dragAction :
                                    //No. Choose it but at the first relative fret.
                                    {
                                        sounded: state.dragAction.sounded,
                                        finger: state.dragAction.finger,
                                        fret: Frets.Relative.first} :
                                //No. Is the current string unsounded?
                                state.schema[targetString-1] === Shapes.StringAction.unsounded ?
                                    //Yes. Replace with open.
                                    Shapes.StringAction.open :
                                    //No. Replace with unsounded.
                                    Shapes.StringAction.unsounded)
                    ) => ({
                        change: schema[targetString - 1],
                        schema: schema}))})),
                Fretboard = Module.of((
                    padding=ShapeChart.FingerIndicator.Style.radius,
                    mouseXToClosestString=MouseXToClosestStringMapperBuilder
                        .withLeftPadding(padding)
                ) => ({
                    Style: {padding: padding},
                    mouseTrapStateToSchemaChange: state => Module.of((
                        targetString=mouseXToClosestString(state.mousePosition[0]),
                        targetFret=Frets.Relative.all
                            .map(fret => ({
                                fret: fret,
                                distanceYToMouse: Math.abs(state.mousePosition[1] -
                                    ShapeChart.Fretboard.Style.fretHeight * (fret - .5))}))
                            .reduce((a, b) => a.distanceYToMouse <= b.distanceYToMouse ? a : b)
                            .fret,
                        targetFinger = state.activeFinger,
                        //String actions that match the target finger are replaced with unsounded as the schema is
                        //retrieved from the state. How this is done depends on whether or not targetFinger is *.
                        schema = Module.of((
                            isTargetFingerAndNotTargetFret=stringAction =>
                                Shapes.StringAction.isFingered(stringAction) &&
                                stringAction.finger === targetFinger &&
                                stringAction.fret !== targetFret
                        ) => targetFinger === Fingers.any ? (   //Is targetFinger *?
                                //Yes. Only replace the string action at the targetString with unsounded if
                                //it is a fingered string action && the target finger && not the target fret.
                                isTargetFingerAndNotTargetFret(state.schema[targetString-1]) ?
                                    Arrays.replaceItem(state.schema, targetString-1, Shapes.StringAction.unsounded) :
                                    state.schema) :
                            //No. Convert any same-fingered but different-fret string actions to unsounded.
                            state.schema.map(stringAction => isTargetFingerAndNotTargetFret(stringAction) ?
                                Shapes.StringAction.unsounded :
                                stringAction)),
                        //Determine which stringAction will be used to substitute others.
                        //This depends on whether the mouse is being dragged and its drag action,
                        //or whether or not the existing string action on the target string
                        //is fingered and has a matching fret and finger
                        substituteStringAction = Module.of((dragAction=state.dragAction) => dragAction !== null ?
                            //The mouse is being dragged
                            Shapes.StringAction.isFingerless(dragAction) ?
                                //The drag action is fingerless
                                dragAction :
                                dragAction.sounded === true ?
                                    //The drag action is fingered and sounded
                                    Shapes.StringAction.fingered(targetFret, targetFinger) :
                                    //The drag action is deadened
                                    Shapes.StringAction.deadened(targetFret, targetFinger) :
                            //The mouse is not being dragged
                            Module.of((currentAction = schema[targetString - 1]) =>
                                Shapes.StringAction.isFingerless(currentAction) ||
                                currentAction.finger !== targetFinger ||
                                currentAction.fret !== targetFret
                                    ?
                                    //The target action is not over an identical string action
                                    Shapes.StringAction.fingered(targetFret, targetFinger) : (
                                        //The target action is over an identical string action
                                        currentAction.sounded === true ?
                                            //And that action is sounded
                                            Shapes.StringAction.deadened(targetFret, targetFinger) :
                                            //And that action is deadened
                                            Shapes.StringAction.unsounded)))
                    ) => {
                        //A finger action may be created or extended if the substitute string action is
                        //not a deadened version of its sounded substitutee and the targetFinger is not *.
                        if(Shapes.StringAction.isFingered(substituteStringAction) && targetFinger !== Fingers.any && (
                            substituteStringAction.sounded === true ||
                            Shapes.StringAction.isFingerless(schema[targetString - 1]) ||
                            schema[targetString - 1].finger !== targetFinger)) {
                            //Yes. A finger may may have to be created or extended.
                            //Get the string actions with targetFret and targetFinger
                            const targetFingerAndFretActions = schema
                                .map((stringAction, i) => ({
                                    string: i+1,
                                    action: stringAction}))
                                .filter(stringAction =>
                                    stringAction.string !== targetString &&
                                    Shapes.StringAction.isFingered(stringAction) &&
                                    stringAction.action.fret === targetFret &&
                                    stringAction.action.finger === targetFinger);
                            //Is there an existing finger action with the same finger and fret?
                            if(targetFingerAndFretActions.length > 0) {
                                //Yes. Fill the gap with the substitute action.
                                Numbers
                                    .range(
                                        1 + (
                                            targetString < targetFingerAndFretActions[0].string ?
                                                targetString :
                                                Arrays.last(targetFingerAndFretActions).string),
                                        targetString > Arrays.last(targetFingerAndFretActions).string ?
                                            targetString :
                                            targetFingerAndFretActions[0].string)
                                    .forEach(string => schema[string - 1] = substituteStringAction);}}
                        //Finally, substitute for the targetString itself.
                        schema[targetString - 1] = substituteStringAction;
                        return {
                            change: substituteStringAction,
                            schema: schema};})})),
                AnyStringAction = Module.of((
                    horizontalPadding=ShapeChart.FingerIndicator.Style.radius,
                    mouseXToClosestString=MouseXToClosestStringMapperBuilder
                        .withLeftPadding(horizontalPadding + ShapeChart.FingerlessIndicator.Style.radius)
                ) => ({
                    Style: {
                        padding: {
                            horizontal: horizontalPadding,
                            vertical: 7}},
                    mouseTrapStateToSchemaChange: state=>Module.of((
                        targetString = mouseXToClosestString(state.mousePosition[0]),
                        schema = Arrays.replaceItem(
                            state.schema,
                            targetString-1,
                            //Is there currently a drag action?
                            state.dragAction !== null ?
                                //Yes. Is it fingerless?
                                Shapes.StringAction.isFingerless(state.dragAction) ?
                                    //Yes. Choose it.
                                    state.dragAction :
                                    //No. Choose it but at the last relative fret.
                                    {
                                        sounded: state.dragAction.sounded,
                                        finger: state.dragAction.finger,
                                        fret: Frets.Relative.last} :
                                //No. Is the current string action *?
                                state.schema[targetString-1] === Shapes.StringAction.any ?
                                    //Yes. Replace with unsounded.
                                    Shapes.StringAction.unsounded :
                                    //No. Replace with *.
                                    Shapes.StringAction.any)
                    ) => ({
                        change: schema[targetString - 1],
                        schema: schema}))}))
            ) => ({
                withSchema: Schema => ({
                    withPreview: Preview => ({
                        withActiveFingerGetter: activeFingerGetter => Module.of((
                            withAnyStringActionStep=includeAnyStringAction => Module.of((
                                dragAction=null,
                                previousMousePosition=null,
                                currentMouseTrap=null,  //The mouse trap that the mouse is currently over, or null
                                mousePositionToState=position => ({
                                    mousePosition: position,
                                    schema: Schema.get().slice(),
                                    activeFinger: activeFingerGetter(),
                                    dragAction: dragAction
                                }),
                                createMouseEventListeners = stateToSchemaChangeMapper => Module.of((
                                    mouseEventToSchemaChange = e => stateToSchemaChangeMapper(
                                        mousePositionToState([e.offsetX, e.offsetY]))
                                ) => ({
                                    mouseenter: function(e) {
                                        currentMouseTrap = this;
                                        const schema = mouseEventToSchemaChange(e).schema;
                                        if(dragAction !== null) {
                                            Schema.set(schema);}
                                        else {
                                            Preview.set(schema);}},
                                    mousemove: e => {
                                        previousMousePosition = [e.offsetX, e.offsetY];
                                        const schema = mouseEventToSchemaChange(e).schema;
                                        if(dragAction !== null) {
                                            Schema.set(schema);}
                                        else {
                                            Preview.set(schema);}},
                                    mousedown: Module.of((
                                        mouseUpEventHandler = Module.of((mouseUpEventHandler=undefined) => {
                                            mouseUpEventHandler = () => {
                                                dragAction = null;
                                                if(currentMouseTrap !== null) {
                                                    Preview.set(Schema.get());}
                                                else {
                                                    Preview.set(null);}
                                                window.removeEventListener("mouseup", mouseUpEventHandler);};
                                            return mouseUpEventHandler;})
                                    ) => e => {
                                        const schemaChange = mouseEventToSchemaChange(e);
                                        dragAction = schemaChange.change;
                                        Schema.set(schemaChange.schema);
                                        Preview.set(null);
                                        window.addEventListener("mouseup", mouseUpEventHandler)}),
                                    mouseout: () => {
                                        currentMouseTrap = null;
                                        Preview.set(null);}})),
                                previousFretboardMousePosition=null,
                                fingerlessIndicatorMouseTrap=SVG.Builder.MouseTrap
                                    .withX(ShapeChart.FingerlessIndicator.Style.startX  -
                                        FingerlessIndicators.Style.padding.horizontal)
                                    .withY(ShapeChart.FingerlessIndicator.Style.startY -
                                        FingerlessIndicators.Style.padding.vertical)
                                    .withWidth(ShapeChart.Fretboard.Style.width +
                                        ShapeChart.FingerlessIndicator.Style.diameter +
                                        2 * FingerlessIndicators.Style.padding.horizontal)
                                    .withHeight(ShapeChart.FingerlessIndicator.Style.diameter +
                                        ShapeChart.FingerlessIndicator.Style.margin +
                                        FingerlessIndicators.Style.padding.vertical)
                                    .withClass("fingerless-indicators-mouse-trap")
                                    .withEventListeners(createMouseEventListeners(
                                        FingerlessIndicators.mouseTrapStateToSchemaChange)),
                                fretboardMouseTrap=SVG.Builder.MouseTrap
                                    .withX(ShapeChart.Fretboard.Style.x - Fretboard.Style.padding)
                                    .withY(ShapeChart.Fretboard.Style.y)
                                    .withWidth(ShapeChart.Fretboard.Style.width + 2 * Fretboard.Style.padding)
                                    .withHeight(ShapeChart.Fretboard.Style.height + Fretboard.Style.padding)
                                    .withClass("fretboard-mouse-trap")
                                    .withEventListeners(createMouseEventListeners(
                                        Fretboard.mouseTrapStateToSchemaChange)),
                                shapeInputMouseTraps=SVG.Builder.G()
                                    .withClass("shape-input-mouse-traps")
                                    .withChild(fingerlessIndicatorMouseTrap)
                                    .withChild(fretboardMouseTrap)
                                    .withMethod("activeFingerChanged", () => {
                                        if(currentMouseTrap === fretboardMouseTrap) {
                                            Preview.set(Fretboard
                                                .mouseTrapStateToSchemaChange(
                                                    mousePositionToState(previousMousePosition))
                                                .schema)}})
                            ) => includeAnyStringAction === false ?
                                shapeInputMouseTraps :          //Do not include 'any string action' mouse trap
                                shapeInputMouseTraps.withChild( //Do include...
                                    SVG.Builder.MouseTrap
                                        .withX(ShapeChart.FingerlessIndicator.Style.startX  -
                                            AnyStringAction.Style.padding.horizontal)
                                        .withY(ShapeChart.Fretboard.Style.y +
                                            ShapeChart.Fretboard.Style.height)
                                        .withWidth(ShapeChart.Fretboard.Style.width +
                                            ShapeChart.FingerlessIndicator.Style.diameter +
                                            2 * AnyStringAction.Style.padding.horizontal)
                                        .withHeight(ShapeChart.FingerlessIndicator.Style.diameter +
                                            ShapeChart.FingerlessIndicator.Style.margin +
                                            AnyStringAction.Style.padding.vertical)
                                        .withClass("fingerless-indicators-mouse-trap")
                                        .withEventListeners(createMouseEventListeners(
                                            AnyStringAction.mouseTrapStateToSchemaChange))))
                        ) => ({
                            withAnyStringAction: () => withAnyStringActionStep(true),
                            withoutAnyStringAction: () => withAnyStringActionStep(false)}))})})})),
            createShapeInput=(schema, withWildcards) => Module.of((
                shapeChart = Module.of((
                    anyStringActionStep=ShapeChart.Builder
                        .forSchema(schema)
                        .unfixed()
                ) => withWildcards === true ?
                    anyStringActionStep.withAnyStringAction() :
                    anyStringActionStep.withoutAnyStringAction()),
                previewMeatContainer = SVG.Builder.G()
                    .withClass("preview-meat-container")
                    .withAttributes({
                        fillOpacity: .4,
                        strokeOpacity: .5})
                    .disableTextSelection(),
                fingerInput = withWildcards === true ?
                    FingerInput.Builder.withWildcard() :
                    FingerInput.Builder.withoutWildcard(),
                Preview = Module.of((value=null) => ({
                    get: () => value,
                    set: preview => {
                        //Do nothing if no difference
                        if(value === preview) return;
                        //Clear the preview meat
                        previewMeatContainer.innerHTML = "";
                        //Is the new preview something?
                        if(preview !== null) {
                            //Yes. Update the preview meat.
                            previewMeatContainer.withChild(ShapeChart.MeatBuilder.forSchema(preview));
                            // Is the old preview nothing?
                            if(value === null) {
                                //Yes. Make the active meat translucent.
                                shapeChart
                                    .querySelector(".shape-chart-meat")
                                    .withAttributes({
                                        fillOpacity: .6,
                                        strokeOpacity: .5});}}
                        //The new preview is nothing. Is the old preview something?
                        else if(value !== null) {
                            //Yes. Make the active meat opaque
                            shapeChart
                                .querySelector(".shape-chart-meat")
                                .withoutAttributes(["fill-opacity", "stroke-opacity"]);}
                        //Update the value
                        value = preview;}})),
                Schema = Module.of((
                    changeListener=undefined,
                    shapeChartSchemaSetter = Object.getOwnPropertyDescriptor(shapeChart, "schema").set,
                    schemaSetter = schema => {
                        if(! Shapes.Schema.equals(schema, shapeChart.schema)) {
                            shapeChartSchemaSetter(schema);
                            if(changeListener !== undefined) {
                                changeListener(schema);}}}
                ) => {
                    shapeChart.withSetter("schema", schemaSetter);
                    const Schema = {
                        setChangeListener: (listener) => changeListener = listener,
                        get: () => shapeChart.schema,
                        set: schemaSetter};
                    Schema.set(schema);
                    return Schema;}),
                mouseTraps = Module.of((
                    includeAnyStringActionStep=MouseTrapsBuilder
                        .withSchema(Schema)
                        .withPreview(Preview)
                        .withActiveFingerGetter(() => fingerInput.selected)
                ) => withWildcards === true ?
                    includeAnyStringActionStep.withAnyStringAction() :
                    includeAnyStringActionStep.withoutAnyStringAction())
            ) => SVG.Builder.G()
                .withClass("shape-input")
                .withChild(shapeChart
                    .withChild(previewMeatContainer)
                    .withChild(mouseTraps))
                .withChild(fingerInput
                    .moveTo(
                        ShapeChart.Style.width + shapeChartMarginRight,
                        ShapeChart.Fretboard.Style.y)
                    //When the selected finger updates, refresh the preview
                    .withChangeListener(mouseTraps.activeFingerChanged))
                .withGetterAndSetter("schema", Schema.get, Schema.set)
                .withMethod("withChangeListener", function(changeListener) {
                    Schema.setChangeListener(changeListener);
                    return this;})
                .withMethods({
                    focus: () => fingerInput.focus(),
                    focused: function() {
                        this.focus();
                        return this;},
                    unfocus: () => fingerInput.unfocus(),
                    unfocused: function() {
                        this.unfocus();
                        return this;}})),
            withSchemaStep = includeWildcards => ({
                withSchema: schema => createShapeInput(schema, includeWildcards),
                blank: () => createShapeInput(
                    includeWildcards === true ?
                        Shapes.Schema.allAnyStringAction :
                        Shapes.Schema.allUnsounded,
                    includeWildcards)})
        ) => ({
            withWildcards: () => withSchemaStep(true),
            withoutWildcards: () => withSchemaStep(false)}))}));

    const RootFretRangeInput = Module.of((
        RootFretRangeStyle = Module.of((
            rangeMarkerRadius=11,
            tickRadius = (3/8) * rangeMarkerRadius,
            skeletonHeight = 2 * tickRadius,
            mouseTrapHorizontalPadding = rangeMarkerRadius,
            rangeLabelHalfHeight = 9,
            rangeLabelMarginTop = 16
        ) => ({
            normalStrokeWidth: 1,
            emphasisStrokeWidth: 1.5,
            activeStrokeWidth: 2,
            tickRadius: tickRadius,
            rangeLabelHalfHeight: rangeLabelHalfHeight,
            rangeLabelMarginTop: rangeLabelMarginTop,
            rangeLabelFontSize: 13,
            rangeLabelFont: "Courier New",
            rangeLabelTextSpacing: 40,
            mouseTrapHorizontalPadding: mouseTrapHorizontalPadding,
            rangeMarkerRadius: rangeMarkerRadius,
            skeletonHeight: skeletonHeight,
            height: 2 *  + rangeLabelMarginTop + rangeLabelHalfHeight}))
    ) => ({
        Style: {
            height: RootFretRangeStyle.height},
        Builder: {
            withRange: range => ({
            withWidth: width => Module.of((
                rootFretToXCoordinate = Module.of((
                    tickSpacing=width/(Frets.roots.length-1),
                ) => rootFret => (rootFret-1) * tickSpacing),
                rootFretXCoordinates = Frets.roots.map(rootFret => ({
                    rootFret: rootFret,
                    x: rootFretToXCoordinate(rootFret)})),
                xCoordinateToRootFret = Module.of((
                    binarySearchEven = (candidates, x, halfLength = candidates.length/2) =>
                        x < .5 * (candidates[halfLength-1].x + candidates[halfLength].x) ?
                            candidates.slice(0, halfLength) :
                            candidates.slice(halfLength, candidates.length),
                    binarySearchOdd = (candidates, x, halfIndex=(candidates.length-1) / 2) =>
                        x < candidates[halfIndex].x ?
                            candidates.slice(0, halfIndex + 1) :
                            candidates.slice(halfIndex, candidates.length),
                    binarySearch = (candidates, x) => candidates.length > 1 ?
                        binarySearch(
                            1 === candidates.length % 2 ?
                                binarySearchOdd(candidates, x) :
                                binarySearchEven(candidates, x),
                            x) :
                        candidates[0].rootFret
                ) => x => binarySearch(rootFretXCoordinates, x)),
                baseline = SVG.Builder.Line
                    .withEndpoints([0, 0], [width, 0])
                    .withClass("root-fret-range-input-baseline")
                    .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth),
                activeBaseline = SVG.Builder.Line
                    .withoutEndpoints()
                    .withClass("root-fret-range-input-active-baseline")
                    .withAttribute("stroke-width", RootFretRangeStyle.activeStrokeWidth)
                    .withMethod("withRange", function(min, max) {
                        return min !== max ?
                            this
                                .withEndpoints(
                                    [rootFretToXCoordinate(min), 0],
                                    [rootFretToXCoordinate(max), 0])
                                .show() :
                            this.hide();}),
                skeleton = Module.of((
                    rootFretXCoordinateToTick=rootFretXCoordinate=>SVG.Builder.Line
                        .withEndpoints(
                            [rootFretXCoordinate.x, -RootFretRangeStyle.tickRadius],
                            [rootFretXCoordinate.x, RootFretRangeStyle.tickRadius])
                        .withClass("root-fret-range-tick")
                        .withDataAttribute("value", rootFretXCoordinate.rootFret),
                    rootFretTicks=rootFretXCoordinates.reduce(
                        (tickMap, rootFretXCoordinate) => {
                            tickMap[rootFretXCoordinate.rootFret] = rootFretXCoordinateToTick(rootFretXCoordinate);
                            return tickMap;},
                        {})
                ) => SVG.Builder.G()
                    .withClass("root-fret-range-skeleton")
                    .withChild(baseline)
                    .withChild(activeBaseline)
                    .withChild(SVG.Builder.G()
                        .withClass("root-fret-range-ticks")
                        .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth)
                        .withChildren(Object.values(rootFretTicks)))),
                rangeLabel = Module.of((
                    createText=()=>SVG.Builder.Text
                        .withoutTextContent()
                        .withAttributes({
                            fontFamily: RootFretRangeStyle.rangeLabelFont,
                            fontSize: RootFretRangeStyle.rangeLabelFontSize,
                            textAnchor: "middle"}),
                    expressionText=createText()
                        .withTextContent("<= r <=")
                        .withClass("root-fret-range-input-label-min"),
                    minText=createText()
                        .withClass("root-fret-range-input-label-min")
                        .move(-RootFretRangeStyle.rangeLabelTextSpacing, 0),
                    maxText=createText()
                        .withClass("root-fret-range-input-label-max")
                        .move(RootFretRangeStyle.rangeLabelTextSpacing, 0)
                ) => SVG.Builder.G()
                    .withClass("root-fret-range-input-label")
                    .withChildren([minText, expressionText, maxText])
                    .disableTextSelection()
                    .moveTo(
                        .5 * width,
                        RootFretRangeStyle.skeletonHeight + RootFretRangeStyle.rangeLabelMarginTop)
                    .withMethods({
                        withRange: function(minRootFret, maxRootFret) {
                            minText.withTextContent(minRootFret);
                            maxText.withTextContent(maxRootFret);
                            return this;},
                        withValue: function(rootFret) {
                            return this.withRange(rootFret, rootFret);}})),
                mouseTrap = SVG.Builder.MouseTrap
                    .withX(-RootFretRangeStyle.mouseTrapHorizontalPadding)
                    .withY(-.5 * RootFretRangeStyle.height)
                    .withWidth(width + 2 * RootFretRangeStyle.mouseTrapHorizontalPadding)
                    .withHeight(RootFretRangeStyle.height)
                    .withClass("root-fret-range-mouse-trap"),
                rangeMarkers = Module.of((
                    rootFretToCenter=rootFret=>[rootFretToXCoordinate(rootFret), 0],
                    rootFret=null,
                    moveMarkerToRootFret=(marker, rootFret) => {
                        const center = rootFretToCenter(rootFret);
                        marker.withAttributes({
                            cx: center[0],
                            cy: center[1]})},
                    markerForType=markerType=>SVG.Builder.Circle
                        .withCenter([0,0])
                        .withRadius(RootFretRangeStyle.rangeMarkerRadius)
                        .withClass("root-fret-range-marker")
                        .withAttributes({
                            cursor: "pointer",
                            pointerEvents: "all",
                            fill: "none"})
                        .withDataAttribute("markerType", markerType)
                        .withGetter("type", () => markerType)
                        .withModification(function() {
                            const RootFret = Module.of((value=null) => ({
                                get: () => value,
                                set: rootFret => {
                                    if(rootFret !== value) {
                                        if(rootFret !== null) {
                                            this.center=rootFretToCenter(rootFret);
                                            if(value === null) {
                                                this.show();}}
                                        else {
                                            this.hide();}
                                        value = rootFret;}}}));
                            this.withGetterAndSetter("rootFret", RootFret.get, RootFret.set);
                            this.withMethod("atRootFret", function(rootFret) {
                                this.rootFret = rootFret;
                                return this;});
                            this.withMethod("withoutRootFret", function() {
                                this.rootFret = null;
                                return this;})})
                        .withMethods({
                            deactivate: function() {
                                this.withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth);},
                            deactivated: function() {
                                this.deactivate();
                                return this;},
                            emphasize: function() {
                                this.withAttribute("stroke-width", RootFretRangeStyle.emphasisStrokeWidth);},
                            emphasized: function() {
                                this.emphasize();
                                return this;},
                            activate: function() {
                                this.withAttribute("stroke-width", RootFretRangeStyle.activeStrokeWidth);},
                            activated: function() {
                                this.activate();
                                return this;}})
                        .deactivated()
                        .hide(),
                    min= markerForType("min"),
                    max= markerForType("max"),
                    pivot= markerForType("pivot"),
                    preview= markerForType("preview").withAttributes({
                        strokeDasharray: "3 4",
                        pointerEvents: "none"}),
                    minAndMax=[min, max]
                ) => ({
                    min: min,
                    max: max,
                    pivot: pivot,
                    preview: preview,
                    minAndMax: minAndMax,
                    minMaxAndPivot: [min, max, pivot],
                    //preview goes first in all so it is behind others
                    all:  [preview, min, max, pivot]})),
                Range = Module.of((
                    value=undefined,
                    changeListener=null,
                    isSingleValue = range => range.min === range.max,
                    Range= {
                        setChangeListener: listener => changeListener = listener,
                        get: () => value,
                        set: (min, max=min) => {
                            const range = Frets.Range.create(min, max);
                            if(value !== undefined && Frets.Range.equals(value, range)) {
                                return;}
                            //Is the new range a single value?
                            if(isSingleValue(range)) {
                                //Yes.
                                activeBaseline.hide();
                                rangeLabel.withValue(range.min);
                                rangeMarkers.pivot.atRootFret(range.min);
                                //Was the old range not a single value?
                                if(value === undefined || ! isSingleValue(value)) {
                                    //Yes. Swap which markers are visible.
                                    rangeMarkers.minAndMax.forEach(rangeMarker => rangeMarker.rootFret = null);}}
                            else {
                                //No.
                                activeBaseline.show();
                                rangeLabel.withRange(range.min, range.max);
                                activeBaseline.withRange(range.min, range.max);
                                rangeMarkers.min.atRootFret(range.min);
                                rangeMarkers.max.atRootFret(range.max);
                                //Was the old range a single value?
                                if(value === undefined || isSingleValue(value)) {
                                    //Yes. Hide the pivot.
                                    rangeMarkers.pivot.rootFret = null;}}
                            value = range;
                            if(changeListener) {
                                changeListener(range);}},
                        isSingleValue: () => isSingleValue(value)}
                ) => {
                    Range.set(range.min, range.max);
                    return Range;}),
                States = Module.of((
                    mouseEventToRootFret = e => xCoordinateToRootFret(
                        MouseEvents.relativeMousePosition(e, baseline)[0]),
                    States={ //Placeholder activate methods to be defined later
                        Inactive: {activate: () => undefined},
                        Dragging: {activate: marker => undefined}},
                    setStates=States={
                        Inactive: Module.of((
                            visibleRangeMarkers=[],
                            changeToDraggingState=activeRangeMarker => undefined,
                            PreviewRootFret=Module.of((
                                value=null,
                                EmphasizedMarker=Module.of((
                                    emphasizedMarker=null,
                                    unsetEmphasizedMarker=() => {
                                        if(emphasizedMarker !== null) {
                                            emphasizedMarker.deactivate();
                                            emphasizedMarker = null;}}
                                ) => ({
                                    unset: unsetEmphasizedMarker,
                                    atRootFret: rootFret => {
                                        unsetEmphasizedMarker();
                                        visibleRangeMarkers.forEach(visibleMarker => Functions.ifThen(
                                            visibleMarker.rootFret === rootFret,
                                            () => {
                                                visibleMarker.emphasize();
                                                emphasizedMarker = visibleMarker;}));}})),
                                setPreviewRootFret = rootFret => {
                                    if(value !== rootFret) {
                                        EmphasizedMarker.atRootFret(rootFret);
                                        rangeMarkers.preview.atRootFret(rootFret);
                                        value = rootFret;}}
                            ) => ({
                                set: setPreviewRootFret,
                                unset: () => setPreviewRootFret(null)})),
                            mouseTrapEventListeners={
                                mouseEnter: e => PreviewRootFret.set(mouseEventToRootFret(e)),
                                mouseMove: e => PreviewRootFret.set(mouseEventToRootFret(e)),
                                mouseDown: e => {
                                    Range.set(mouseEventToRootFret(e));
                                    changeToDraggingState(rangeMarkers.pivot);},
                                mouseLeave: () => PreviewRootFret.unset()},
                            markersEventListeners = null
                        ) => {
                            changeToDraggingState=activeRangeMarker=>{
                                PreviewRootFret.unset();
                                mouseTrap.withoutEventListeners(mouseTrapEventListeners);
                                visibleRangeMarkers.forEach(marker =>
                                    marker.withoutEventListeners(markersEventListeners[marker.type]));
                                States.Dragging.activate(activeRangeMarker);};
                            return {
                                activate: () => {
                                    visibleRangeMarkers = Range.isSingleValue() ?
                                        [rangeMarkers.pivot] :
                                        rangeMarkers.minAndMax;
                                    markersEventListeners=Object.fromEntries(
                                        visibleRangeMarkers.map(marker => [
                                            marker.type,
                                            Module.of((markerRootFret=marker.rootFret) => ({
                                                mouseEnter: () => PreviewRootFret.set(markerRootFret),
                                                mouseLeave: () => PreviewRootFret.unset(),
                                                mouseDown: () => changeToDraggingState(marker)}))]));
                                    visibleRangeMarkers.forEach(marker =>
                                        marker.withEventListeners(markersEventListeners[marker.type]));
                                    mouseTrap.withEventListeners(mouseTrapEventListeners);}};}),
                        Dragging: Module.of((
                            ActiveMarker=Module.of((value=null) => ({
                                get: () => value,
                                set: activeMarker => {
                                    if(activeMarker !== value) {
                                        if (value !== null) {
                                            value.deactivate();}
                                        if(activeMarker !== null) {
                                            activeMarker.activate();}
                                        value = activeMarker;}}})),
                            MouseMoveListener=Module.of((
                                value,
                                remove=()=>window.removeEventListener("mousemove", value)
                            ) => ({
                                get: () => value,
                                set: listener => {
                                    if(listener !== value) {
                                        if(value !== null) {
                                            remove();}
                                        window.addEventListener("mousemove", listener);
                                        value = listener;}},
                                unset: () => {
                                    remove();
                                    value = null;}})),
                            mouseUpListener=undefined,
                            setupMouseUpListener= mouseUpListener=e=>{
                                const relativeMousePosition=MouseEvents.relativeMousePosition(e, mouseTrap);
                                const activeMarker = ActiveMarker.get();
                                ActiveMarker.set(null);
                                if(
                                    //Is the mouse  over the active marker's root fret
                                    mouseEventToRootFret(e) === activeMarker.rootFret &&
                                    //or not within the RootFretInput's bounding box?
                                    relativeMousePosition[0] >= 0 &&
                                    relativeMousePosition[1] >= 0 &&
                                    relativeMousePosition[0] <= width &&
                                    relativeMousePosition[1] <= RootFretRangeStyle.height) {
                                    //No. Emphasize the active marker.
                                    activeMarker.emphasize();}
                                MouseMoveListener.unset();
                                window.removeEventListener("mouseup", mouseUpListener);
                                States.Inactive.activate();},
                            MinDragging=undefined,
                            MaxDragging=undefined,
                            PivotDragging={
                                activate: pivotRootFret => {
                                    ActiveMarker.set(rangeMarkers.pivot);
                                    rangeMarkers.minAndMax.forEach(extremumMarker=>extremumMarker.hide());
                                    MouseMoveListener.set(e=>{
                                        const rootFret = mouseEventToRootFret(e);
                                        if(rootFret > pivotRootFret) {
                                            rangeMarkers.pivot.deactivated().hide();
                                            Range.set(pivotRootFret, rootFret);
                                            MaxDragging.activate();}
                                        else if (rootFret < pivotRootFret) {
                                            rangeMarkers.pivot.deactivated().hide();
                                            Range.set(rootFret, pivotRootFret);
                                            MinDragging.activate();}});}},
                            setupMinDragging=MinDragging={
                                activate: () => {
                                    const range = Range.get();
                                    ActiveMarker.set(rangeMarkers.min);
                                    const maxRootFret = range.max;
                                    MouseMoveListener.set(e=>{
                                        const rootFret = mouseEventToRootFret(e);
                                        if(rootFret === maxRootFret) {
                                            Range.set(rootFret);
                                            PivotDragging.activate(maxRootFret);}
                                        else if(rootFret > maxRootFret) {
                                            Range.set(maxRootFret, rootFret);
                                            MaxDragging.activate();}
                                        else {
                                            Range.set(rootFret, maxRootFret);}});}},
                            setupMaxDragging=MaxDragging = {
                                activate: () => {
                                    const range = Range.get();
                                    ActiveMarker.set(rangeMarkers.max);
                                    const minRootFret = range.min;
                                    MouseMoveListener.set(e=>{
                                        const rootFret = mouseEventToRootFret(e);
                                        if(rootFret === minRootFret) {
                                            Range.set(rootFret);
                                            PivotDragging.activate(minRootFret);}
                                        else if(rootFret < minRootFret) {
                                            Range.set(rootFret, minRootFret);
                                            MinDragging.activate();}
                                        else {
                                            Range.set(minRootFret, rootFret);}});}}
                        ) => ({
                            activate: activeMarker => {
                                window.addEventListener("mouseup", mouseUpListener);
                                activeMarker === rangeMarkers.min ?
                                    MinDragging.activate() :
                                activeMarker === rangeMarkers.max ?
                                    MaxDragging.activate() :
                                PivotDragging.activate(activeMarker.rootFret);}}))}
                ) => States.Inactive.activate())
            ) => SVG.Builder.G()
                .withClass("root-fret-range-input")
                .withChild(skeleton)
                .withChild(rangeLabel)
                .withChild(mouseTrap)
                .withChild(SVG.Builder.G()
                    .withClass("root-fret-range-markers")
                    .withChildren(rangeMarkers.all))
                .withGetterAndSetter("range",
                    () => Range.get(),
                    range => Range.set(range.min, range.max))
                .withMethod("withRange", function(range) {
                    this.range = range;
                    return this;})
                .withMethod("withChangeListener", function(changeListener) {
                    Range.setChangeListener(changeListener);
                    return this;}))})}}));

    const ShapeCreator = Module.of((
        ShapeCreatorStyle = Module.of((
            width=ShapeInput.Style.width,
            RootFretRangeStyle = Module.of((marginTop=29) => ({
                x: ShapeChart.Fretboard.Style.x,
                y: ShapeChart.Style.height + marginTop,
                marginTop: marginTop})),
            ButtonsStyle=Module.of((
                buttonsMarginTop = 10,
                buttonsWidth = width / (2 + 3 / Numbers.goldenRatio),
                buttonsHeight = buttonsWidth / Numbers.goldenRatio,
                buttonsStartX = 0,
                buttonsY = RootFretRangeStyle.y + RootFretRangeInput.Style.height + buttonsMarginTop
            ) => ({
                marginTop: buttonsMarginTop,
                width: buttonsWidth,
                startX: buttonsStartX,
                y: buttonsY,
                height: buttonsHeight,
                spacing: buttonsWidth / Numbers.goldenRatio})),
            ErrorMessageStyle=Module.of((marginTop = 6) => ({
                x: .5 * width,
                y: ButtonsStyle.y + ButtonsStyle.height + marginTop,
                height: 15, //hardcoded
                marginTop: marginTop,
                fontSize: 11,
                fontFamily: "monospace"}))
        ) => ({
            width: width,
            height: ShapeInput.Style.height +
                RootFretRangeStyle.marginTop +
                RootFretRangeInput.Style.height +
                ButtonsStyle.marginTop +
                ButtonsStyle.height +
                ErrorMessageStyle.marginTop +
                ErrorMessageStyle.height,
            RootFretRange: RootFretRangeStyle,
            Buttons: ButtonsStyle,
            ErrorMessage: ErrorMessageStyle}))
    ) => ({
        Style: {
            width: ShapeCreatorStyle.width,
            height: ShapeCreatorStyle.height},
        new: () => {
            let shapeInput;
            const rootFretRangeInput = Module.of((
                padding=8
            ) => RootFretRangeInput.Builder
                .withRange(Frets.Range.roots)
                .withWidth(ShapeCreatorStyle.width - 2 * padding)
                .move(padding, ShapeCreatorStyle.RootFretRange.y));
            const reset = () => {
                shapeInput.schema = Shapes.Schema.allUnsounded;
                rootFretRangeInput.range = Frets.Range.roots; };
            const saveButton = SVG.Builder.TextButton
                .withDimensions(
                    ShapeCreatorStyle.Buttons.startX +
                    2 * ShapeCreatorStyle.Buttons.height +
                    ShapeCreatorStyle.Buttons.width,
                    ShapeCreatorStyle.Buttons.y,
                    ShapeCreatorStyle.Buttons.width,
                    ShapeCreatorStyle.Buttons.height)
                .withText("Save")
                .withClickHandler(() => {
                    Shapes.add(Shapes.Builder
                        .withoutId()
                        .withSchema(shapeInput.schema)
                        .withRange(rootFretRangeInput.range));
                    reset();})
                .withClass("shape-creator-save-button");
            const errorMessage = SVG.Builder.Text
                .withoutTextContent()
                .withClass("shape-creator-output")
                .moveTo(ShapeCreatorStyle.ErrorMessage.x, ShapeCreatorStyle.ErrorMessage.y)
                .withAttributes({
                    fontSize: ShapeCreatorStyle.ErrorMessage.fontSize,
                    fontFamily: ShapeCreatorStyle.ErrorMessage.fontFamily,
                    textAnchor: "middle",
                    dominantBaseline: "hanging"})
                .disableTextSelection();
            const schemaChangeListener = Module.of((
                schema,
                invalidSaveButtonEventListeners = {
                    mouseEnter: function() {
                        errorMessage.withAttribute("text-decoration", "underline"); },
                    mouseLeave: function() {
                        errorMessage.withoutAttribute("text-decoration"); }},
                validate = () => {
                    errorMessage.textContent = null;
                    saveButton.withoutEventListeners(invalidSaveButtonEventListeners);
                    saveButton.enable();},
                invalidate = (reason) => {
                    errorMessage.textContent = reason;
                    saveButton.withEventListeners(invalidSaveButtonEventListeners);
                    saveButton.disable();}
            ) => (newSchema) => {
                if(schema !== undefined && Shapes.Schema.equals(schema, newSchema)) {
                    return;}
                schema = newSchema;
                const fingerActions = Shapes.Schema.getFingerActions(schema);
                //Validate the schema
                if(Shapes.Schema.equals(schema, Shapes.Schema.allUnsounded)) {
                    invalidate("Enter a shape");}
                else if(false === schema.some(Shapes.StringAction.isFingered)) {
                    invalidate("A shape must use at least one finger");}
                else if(Shapes.existsWithSchema(schema)) {
                    invalidate("A matching shape already exists");}
                else if(fingerActions.length > 0) {
                    if(Shapes.FingerAction.Validations.usesAFingerMoreThanOnce(fingerActions)) {
                        invalidate("A finger is used multiple times on a fret");}
                    else if(Shapes.FingerAction.Validations.lacksRootFret(fingerActions)) {
                        invalidate("Fingers are used, but not on the root fret");}
                    else if(Shapes.FingerAction.Validations.hasFingersCrossedOnAFret(fingerActions)) {
                        invalidate("Fingers are impractically arranged on a fret");}
                    else {
                        validate();}}
                else {
                    validate();}});
            shapeInput = ShapeInput.Builder
                .withoutWildcards()
                .blank()
                .focused()
                .withChangeListener(schemaChangeListener);
            schemaChangeListener(shapeInput.schema);
            return SVG.Builder.G()
                .withClass("shape-creator")
                .withChild(shapeInput)
                .withChild(rootFretRangeInput)
                .withChild(SVG.Builder.TextButton
                    .withDimensions(
                        ShapeCreatorStyle.Buttons.startX + ShapeCreatorStyle.Buttons.height,
                        ShapeCreatorStyle.Buttons.y,
                        ShapeCreatorStyle.Buttons.width,
                        ShapeCreatorStyle.Buttons.height)
                    .withText("Reset")
                    .withClickHandler(reset)
                    .withClass("shape-creator-reset-button"))
                .withChild(saveButton)
                .withChild(errorMessage)}}));

    const ShapesPage = Module.of((
        shapeFilterMarginRight=32,
        topRowMarginBottom=10,
        shapeChartGridPadding= {
            horizontal: 5,
            vertical: 10},
        shapeChartGridMaxColumns=4,
        maxMatches=12
    ) => ({
        new: () => Module.of((
            width = shapeChartGridMaxColumns*ShapeChart.Style.width +
            (shapeChartGridMaxColumns-1)*shapeChartGridPadding.horizontal,
            ShapeItem=Module.of((
                shapeChartMarginBottom=3,
                buttonHeight=18,
                buttonWidth=65,
                buttonPadding=8,
                buttonContainerWidth = 2*buttonWidth + buttonPadding
            ) => ({
                Style: {
                    width: ShapeChart.Style.width,
                    height: ShapeChart.Style.height + shapeChartMarginBottom + buttonHeight},
                shapesToShapeItems: shapes => shapes
                    .slice(0, maxMatches)
                    .map(shape=>Module.of((
                        buttonsContainer=SVG.Builder.ModularGrid
                            .withX(ShapeChart.Fretboard.Style.x - .5 * (
                                buttonContainerWidth - ShapeChart.Fretboard.Style.width))
                            .withY(ShapeChart.Style.height + shapeChartMarginBottom)
                            .withWidth(buttonContainerWidth)
                            .withModuleWidth(buttonWidth)
                            .withModuleHeight(buttonHeight)
                            .withPadding(buttonPadding)
                            .withModules([
                                SVG.Builder.TextButton
                                    .withDimensions(0,0, buttonWidth, buttonHeight)
                                    .withText("Edit")
                                    .withClickHandler(() => console.log("edit clicked for shape with id [" + shape.id + "]")),
                                SVG.Builder.TextButton
                                    .withDimensions(0, 0, buttonWidth, buttonHeight)
                                    .withText("Delete")
                                    .withClickHandler(() => console.log("delete clicked for shape with id [" + shape.id + "]"))])
                            .withClass("shape-item-buttons-container")
                    ) => SVG.Builder.G()
                        .withClass("shape-item")
                        .withChild(ShapeChart.Builder
                            .forSchema(shape.schema)
                            .unfixed()
                            .withoutAnyStringAction())
                        .withChild(buttonsContainer)))})),
            shapeChartGrid=SVG.Builder.ModularGrid
                .withX(0).withY(0)
                .withWidth(width)
                .withModuleWidth(ShapeChart.Style.width)
                .withModuleHeight(ShapeItem.Style.height)
                .withPadding(shapeChartGridPadding.horizontal, shapeChartGridPadding.vertical)
                .withModules(ShapeItem.shapesToShapeItems(Shapes.all))
                .withClass("shape-chart-grid")
                .move(0, ShapeInput.Style.height + topRowMarginBottom),
            shapesPageTopRow=Module.of((
                filterShapes=shapeFilter=>shapeChartGrid.modules = ShapeItem.shapesToShapeItems(
                    Shapes.search(shapeFilter)),
                shapeInput=ShapeInput.Builder
                    .withWildcards()
                    .blank()
                    .focused()
                    .withChangeListener(filterShapes),
                shapesFilterContainer=SVG.Builder.G()
                    .withClass("shapes-filter-container")
                    .withChild(shapeInput)
                    .withChild(SVG.Builder.Text
                        .withTextContent("filte")
                        .withClass("shape-filter-label")
                        .withAttributes({
                            fontFamily: "monospace",
                            fontSize: 15,
                            dominantBaseline: "hanging",
                            textAnchor: "end"})
                        .withTextLength(80)
                        .disableTextSelection()
                        .moveTo(4, 48)
                        .rotateTo(270))
                    .withGetter("shapeInput"),
                shapesButtonContainer=Module.of((
                    buttonWidth=width - ShapeInput.Style.width - shapeFilterMarginRight - ShapeChart.FingerIndicator.Style.radius,
                    numButtons=3,
                    buttonHeight=ShapeChart.Fretboard.Style.height/numButtons,
                    buttonIndexToYCoordinate=index=>index*buttonHeight,
                    createShapeButton=SVG.Builder.TextButton
                        .withDimensions(0, 0, buttonWidth, buttonHeight)
                        .withText("Create")
                        .withClickHandler(() => {
                            shapeInput.unfocus();
                            shapesPage.withChild(SVG.Builder.Modal
                                .withContent(ShapeCreator.new())
                                .withContentSize(ShapeCreator.Style.width, ShapeCreator.Style.height)
                                .withCloseCallback(() => {
                                    shapeInput.focus();
                                    filterShapes(shapeInput.schema);}));}),
                    downloadShapesButton=SVG.Builder.TextButton
                        .withDimensions(0, buttonIndexToYCoordinate(1), buttonWidth, buttonHeight)
                        .withText("Download")
                        .withClickHandler(() => console.log("Download clicked")),
                    uploadShapesButtonContainer=Module.of((
                        nonInteractiveToInteractiveWidthRatio=1/3,
                        medianWidth=18,
                        medianStartX=nonInteractiveToInteractiveWidthRatio*buttonWidth - medianWidth
                    ) => SVG.Builder.G()
                        .withClass("upload-buttons-container")
                        .moveTo(0, buttonIndexToYCoordinate(2))
                        .withAttributes({
                            textAnchor: "middle",
                            dominantBaseline: "central",
                            fontSize: 17,
                            fontFamily: "Courier New"})
                        .disableTextSelection()
                        .withChild(SVG.Builder.G()
                            .withClass("upload-buttons-label-container")
                            .withChild(SVG.Builder.Rect
                                .withX(0)
                                .withY(0)
                                .withWidth(medianStartX)
                                .withHeight(buttonHeight)
                                .withClass("upload-buttons-label-outline")
                                .withAttribute("fill", "#D0D0D0"))
                            .withChild(SVG.Builder.Text
                                .withTextContent("Upload")
                                .withClass("upload-buttons-label")
                                .moveTo(.5 * medianStartX, .5 * buttonHeight)))
                        .withChild(SVG.Builder.G()
                            .withClass("upload-buttons-median-container")
                            .moveTo(medianStartX, 0)
                            .withChild(SVG.Builder.Rect
                                .withX(0)
                                .withY(0)
                                .withWidth(medianWidth)
                                .withHeight(buttonHeight)
                                .withClass("upload-buttons-median-outline")
                                .withAttribute("fill", "#D0D0D0"))
                            .withChild(SVG.Builder.Text
                                .withTextContent("and")
                                .withClass("upload-buttons-median-label")
                                .withTextLength(buttonHeight - 10)
                                .moveTo(.5 * medianWidth, .5 * buttonHeight)
                                .rotateTo(270)))
                        .withChild(Module.of((
                            optionWidth=(1-nonInteractiveToInteractiveWidthRatio) * buttonWidth,
                            optionHeight=.5*buttonHeight
                        ) => SVG.Builder.G()
                            .withClass("upload-buttons-options-container")
                            .moveTo(medianStartX + medianWidth, 0)
                            .withChild(SVG.Builder.TextButton
                                .withDimensions(0, 0, optionWidth, optionHeight)
                                .withText("Append")
                                .withClickHandler(() => console.log("Append clicked"))
                                .withClass("upload-and-append-button"))
                            .withChild(SVG.Builder.TextButton
                                .withDimensions(0, optionHeight, optionWidth, optionHeight)
                                .withText("Replace")
                                .withClickHandler(() => console.log("Replace clicked"))
                                .withClass("upload-and-replace-button")))))
                ) => SVG.Builder.G()
                    .withClass("shapes-button-actions-container")
                    .move(ShapeInput.Style.width + shapeFilterMarginRight, ShapeChart.Fretboard.Style.y)
                    .withChild(createShapeButton)
                    .withChild(uploadShapesButtonContainer)
                    .withChild(downloadShapesButton))
            ) => SVG.Builder.G()
                .withClass("shape-page-top-row")
                .withChild(shapesFilterContainer)
                .withChild(shapesButtonContainer))
        ) => {
            shapesPage = SVG.Builder.G()
                .withClass("shape-search")
                .withChild(shapesPageTopRow)
                .withChild(shapeChartGrid);
            return shapesPage;})}));
    return {
        create: () => SVG.Builder.SVG
            .withWidth(Style.width)
            .withHeight(Style.height)
            .withClass("chord-jog-app")
            .withAttributes({
                fill: "none",
                stroke: Style.colors.heavy,
                strokeWidth: Style.stroke.width,
                strokeLinecap: "round"})
            .withChild(ShapesPage.new())};})();