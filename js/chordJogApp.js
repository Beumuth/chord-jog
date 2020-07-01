const ChordJogApp = (() => {
    const Style = {
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
    Style.font = "Helvetica";

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
                Object.defineProperty(this, key, {get: getter});
                return this; },
            withSetter: function(key, setter) {
                Object.defineProperty(this, key, {set: setter});
                return this; },
            withGetterAndSetter: function(key, getter, setter) {
                Object.defineProperty(this, key, {
                    get: getter,
                    set: setter});
                return this; },
            withGettersAndSetters: function(gettersAndSetters) {
                gettersAndSetters.forEach(property =>
                    Object.defineProperty(this, property.key, {
                        get: property.get,
                        set: property.set}));
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
            using: (object) => helpers.withMethods.bind(object)(helpers)};
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
        updateItem: (array, index, modification) => {
            modification(array[index]);
            return array;}};

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
        thumb: {
            name: "thumb",
                label: "T" },
        index: {
            name: "index",
                label: "1" },
        middle: {
            name: "middle",
                label: "2" },
        ring: {
            name: "ring",
                label: "3" },
        pinky: {
            name: "pinky",
                label: "4" }};
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
                max: max })}};
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
    Frets.Range.full = Frets.Range.create(Frets.first, Frets.last);

    const SVG = Module.of(() => {
        const dashifyAttributeName = (name) =>
            Numbers.range(0, name.length)
                .map(charIndex => ((curChar) =>
                    curChar === curChar.toLowerCase() ?
                        curChar : "-" + curChar.toLowerCase())(
                    name.charAt(charIndex)))
                .join("");
        const createElement = function(tagName) {
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
                    withEventListener: function(eventType, handler) {
                        eventType = eventType.toLowerCase();
                        handler = handler.bind(this);
                        const modifiedHandler = ["mousedown", "mouseup"].includes(eventType) ?
                            function(e) {if(e.button === 0) handler(e);}:
                            handler;
                        this.eventListeners[eventType] = modifiedHandler;
                        this.addEventListener(eventType, modifiedHandler);
                        return this; },
                    withEventListeners: function(eventListeners) {
                        Object.keys(eventListeners).forEach(eventType =>
                            this.withEventListener(eventType, eventListeners[eventType]));
                        return this; },
                    withoutEventListener: function(eventType) {
                        eventType = eventType.toLowerCase();
                        this.removeEventListener(eventType, this.eventListeners[eventType]);
                        delete this.eventListeners[eventType];
                        return this;},
                    withoutEventListeners: function(eventListeners) {
                        Object.keys(eventListeners).forEach(eventType =>
                            this.withoutEventListener(eventType));
                        return this;},
                    withMutationObserver: function(mutationObserver, configuration={}) {
                        mutationObserver.observe(this, configuration);
                        return this; },
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
                    const updateTransform = (element, transformKey, updater) => {
                        const transformAttribute = element.getAttribute("transform");
                        if(transformAttribute === null) {   //Does the element have a transform attribute?
                            //No. Add it.
                            element.setAttribute("transform", `${transformKey}(${updater().join()})`);
                            return;}
                        const indexTransform = transformAttribute.lastIndexOf(transformKey);
                        if(indexTransform === -1) { //Does the transform attribute include a matching transform type?
                            //No. Create and append a transform of the given type the to attribute
                            element.setAttribute("transform",
                                transformAttribute + `${transformKey}(${updater().join()})`);
                            return;
                        }
                        //Transform of the given type does exist.
                        //Replace the transform attribute with its arguments updated.
                        const indexArgsStart = indexTransform + "translate(".length;
                        const indexArgsEnd = transformAttribute.indexOf(")", indexArgsStart);
                        const transformArgs = transformAttribute
                            .substring(indexArgsStart, indexArgsEnd)
                            .split(",")
                            .map(arg => Number.parseFloat(arg.trim()));
                        element.setAttribute("transform",
                            transformAttribute.slice(0, indexArgsStart) +
                            updater(...transformArgs).join() +
                            transformAttribute.slice(indexArgsEnd));};
                    return {
                        move: function(x, y) {
                            updateTransform(this, "translate",
                                (currentX=0, currentY=0) => [currentX+x, currentY+y]);
                            return this;},
                        moveTo: function(x, y) {
                            const boundingClientRect = this.getBoundingClientRect();
                            return this.move(x - boundingClientRect.x, y - boundingClientRect.y);},
                        scale: function(scaleX, scaleY=scaleX) {
                            updateTransform(this, "scale",
                                (currentScaleX=0, currentScaleY=0) => [currentScaleX+scaleX, currentScaleY+scaleY]);
                            return this;}};}))
                .withField("eventListeners", {});};
        const svgBuilder = {
            element: createElement,
            G: () => createElement("g"),
            Circle: ({
                withCenter: (c) => ({
                    withRadius: (radius) =>
                        createElement("circle")
                            .withAttributes({
                                cx: c[0],
                                cy: c[1],
                                r: radius }) }) }),
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
                                return rect; } }) }) }) }),
            SVG: ({
                withWidth: (width) => ({
                    withHeight: (height) =>
                        createElement("svg")
                            .withAttributes({
                                viewBox: `0 0 ${width} ${height}`,
                                xmlns: "xmlns='http://www.w3.org/2000/svg'",
                                width: width,
                                height: height }) }) }),
            Text: Module.of((
                createText = () => createElement("text")
                    .withMethods({
                        withTextContent: function(textContent) {
                            this.textContent = textContent;
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
                        fill: Style.textColor,
                        fontFamily: Style.font})) => ({
                withTextContent: (textContent) => createText().withTextContent(textContent),
                withoutTextContent: () => createText()}))};
        svgBuilder.Rect.copy = (svgRect) => SVG.Builder.Rect
            .withX(svgRect.x)
            .withY(svgRect.y)
            .withWidth(svgRect.width)
            .withHeight(svgRect.height);
        svgBuilder.TextButton = Module.of(() => {
            const padding = 5,
                height=30;
            return {
                withDimensions: (x, y, width, height) => ({
                    withText: (text) => ({
                        withClickHandler: (clickHandler) => {
                            let rect = null;
                            const
                                preview = () => rect.withAttribute("stroke-width", 1.5),
                                normal = () => rect.withAttribute("stroke-width", 1),
                                active = () => rect.withAttribute("stroke-width", 2);
                            rect = SVG.Builder.Rect
                                .withX(0).withY(0)
                                .withWidth(width).withHeight(height)
                                .withClass("text-button-outline")
                                .withAttributes({
                                    pointerEvents: "all",
                                    cursor: "pointer"})
                                .withEventListeners(Module.of(() => {
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
                                            normal();}};}));
                            return SVG.Builder.G()
                                .withClass("text-button")
                                .moveTo(x, y)
                                .withChild(SVG.Builder.Text
                                    .withTextContent(text)
                                    .moveTo(.5 * width, .5 * height)
                                    .withClass("text-button-label")
                                    .withAttributes({
                                        textAnchor: "middle",
                                        dominantBaseline: "central",
                                        fontSize: 17,
                                        fontFamily: "Courier New"})
                                    .disableTextSelection())
                                .withChild(rect);}})})};});
        svgBuilder.MouseTrap = {
            withX: (x) => ({
                withY: (y) => ({
                    withWidth: (width) => ({
                        withHeight: (height) =>
                            svgBuilder.Rect
                                .withX(x)
                                .withY(y)
                                .withWidth(width)
                                .withHeight(height)
                                .withAttributes({
                                    pointerEvents: "fill",
                                    cursor: "pointer",
                                    fill: "none",
                                    stroke: "none"})})})})};
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
                unsounded: "",
                open: "o",
                dead: "x",
                fingered: (fret, finger) => ({
                    sounded: true,
                    fret: fret,
                    finger: finger })};
            StringAction.deadened = (fret, finger) => ({
                sounded: false,
                fret: fret,
                finger: finger });
            StringAction.fromString = (string) =>
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
                                string.charAt(1));
            StringAction.toString = (stringAction) =>
                stringAction === StringAction.unsounded ?
                    StringAction.unsounded :
                    stringAction === StringAction.open ?
                        StringAction.open : stringAction.sounded ?
                        `${stringAction.fret}${stringAction.finger}` :
                        `x${stringAction.fret}${stringAction.finger}`;
            StringAction.isFingerless = (stringAction) => [StringAction.unsounded, StringAction.open].includes(stringAction);
            StringAction.isFingered = (stringAction) => ! StringAction.isFingerless(stringAction);
            StringAction.isDeadened = (stringAction) =>
                StringAction.isFingered(stringAction) && ! stringAction.sounded;
            StringAction.equals = (a, b) => StringAction.toString(a) === StringAction.toString(b);
            return StringAction;});
        const Schema = Module.of(() => {
            const Schema = {
                fromString: (string) => string.split(";").map(StringAction.fromString),
                toString: (shape) => shape.map(StringAction.toString).join(";")};
            Schema.allUnsounded = Schema.fromString(";;;;;");
            Schema.equals = (a, b) => Schema.toString(a) === Schema.toString(b);
            return Schema; });
        return Module.of(() => {
            const Shapes = {
                StringAction: StringAction,
                Schema: Schema,
                all: [],
                create: (shape, range) => ({
                    shape: shape,
                    range: range }),
                fromString: (string) => string.length === 0 ? [] :
                    string.split(/\r?\n/).map((line) => {
                        const lineProperties = line.split(";");
                        return Shapes.create(
                            Schema.fromString(lineProperties[0]),
                            Frets.Range.create(
                                Number.parseInt(lineProperties[1].charAt(0)),
                                Number.parseInt(lineProperties[1].charAt(1)) ) ); }),
                toString: (shapeFilters) => shapeFilters.length === 0 ? "" :
                    shapeFilters
                        .map(shapeFilter =>
                            Schema.toString(shapeFilter.shape) + ";" +
                            shapeFilter.range.min + "," + shapeFilter.range.max)
                        .join("\r\n"),
                    localStorageKey: "chord-jog-shapes",
                loadFromLocalStorage: () => {
                        const shapeFilterString = localStorage.getItem(Shapes.localStorageKey);
                        Shapes.all = shapeFilterString === null || shapeFilterString.length === 0 ?
                            [] : Shapes.all = Shapes.fromString(shapeFilterString);}};
            Shapes.saveToLocalStorage = () => localStorage.setItem(
                    Shapes.localStorageKey,
                    Shapes.toString(Shapes.all));
            return Shapes; });});
    const FingerInput = Module.of(() => {
        const Regions = {
            States: {
                all: [
                    "unselected",
                    "preview",
                    "selected",
                    "unselectable" ],
                isValid: (state) => Regions.States.all.includes(state)  },
            FingerLabel: {
                Text: {
                    createForRegion: (region) => SVG.Builder.Text
                        .withTextContent(region.finger.label)
                        .withAttributes({
                            x: region.initialPosition[0],
                            y: region.initialPosition[1],
                            fontFamily: "Courier New",
                            fontSize: 37,
                            dx: -10.5 + region.initialOffset[0],
                            dy: 10.5 + region.initialOffset[1]})},
                Outline: {
                    createForRegion: (region) => SVG.Builder.Circle
                        .withCenter(region.initialPosition)
                        .withRadius(18)
                        .withClass("finger-label-outline")},
                instantiate: (region) => SVG.Builder
                    .G()
                    .withClass("finger-label")
                    .withDataAttribute("for", region.finger.name)
                    .withChildren([
                        Regions.FingerLabel.Text.createForRegion(region),
                        Regions.FingerLabel.Outline.createForRegion(region)])},
            Joint: {
                instantiate: Module.of(() => {
                    const pointToJoint = (p) => SVG.Builder.Circle
                        .withCenter(p)
                        .withRadius(1)
                        .withClass("finger-input-region-joint")
                        .withAttribute("strokeWidth", 0);
                    return (staticRegion) => staticRegion.jointInfo.length === 1 ?
                        [pointToJoint(staticRegion.jointInfo[0])] :
                        staticRegion.jointInfo.map((region, index) =>
                            pointToJoint(region).withDataAttribute("index", index));})},
            Builder: {
                Static: {
                    withFinger: (finger) => ({
                        withPosition: (p) => ({
                            withOffset: (d) => {
                                const region = {
                                    finger: finger,
                                    initialPosition: p,
                                    initialOffset: d};
                                return {
                                    withPointModel: (p) => {
                                        region.jointInfo = [p];
                                        return region;},
                                    withLineSegmentModel: (lineSegment) => {
                                        region.jointInfo = lineSegment;
                                        return region; } }; }}) }) }}};
        Regions.static = [
            Regions.Builder.Static
                .withFinger(Fingers.thumb)
                .withPosition([37.8, 188])
                .withOffset([-.5, -.5])
                .withLineSegmentModel([[11, 137],[48, 209]]),
            Regions.Builder.Static
                .withFinger(Fingers.index)
                .withPosition([91, 110])
                .withOffset([.5, -.5])
                .withLineSegmentModel([[82, 25], [94, 141]]),
            Regions.Builder.Static
                .withFinger(Fingers.middle)
                .withPosition([135.75, 94])
                .withOffset([0, -.5])
                .withLineSegmentModel([[131, 7], [139, 133]]),
            Regions.Builder.Static
                .withFinger(Fingers.ring)
                .withPosition([177.5, 104])
                .withOffset([-1, 0])
                .withLineSegmentModel([[181, 29], [175, 141]]),
            Regions.Builder.Static
                .withFinger(Fingers.pinky)
                .withPosition([217.3, 130])
                .withOffset([-1.75, -1])
                .withLineSegmentModel([[219, 63], [217, 158]])];
        Regions.staticWithFinger = (finger) => Regions.static.find(region => region.finger === finger)
        Regions.Builder.Instance = {
            withRegionChangeObserver: (regionChangeObserver) => Regions.static.map((staticRegion) => {
                //The 'joints' is either a single or a pair of points used for
                //calculating the closest finger to the mouse.
                //They are added as SVG elements instead of within the static Regions module
                //to allow svg transformations to apply to the coordinates of these points.
                const joints = Regions.Joint.instantiate(staticRegion);
                return Objects.using({
                        finger: staticRegion.finger,
                        distance2Mapper: Module.of(() => {
                            const jointToPoint = (joint) => {
                                const boundingClientRect = joint.getBoundingClientRect();
                                return [boundingClientRect.x, boundingClientRect.y]; };
                            return joints.length === 1 ?
                                (p) => Geometry.distance2(p, jointToPoint(joints[0])):
                                (p) => Geometry.distance2(p,
                                    Geometry.projectPointOnLineSegment(p,
                                        joints.map(jointToPoint)))}),
                        element: SVG.Builder.G()
                            .withClass("finger-input-region")
                            .withDataAttribute("finger", staticRegion.finger.label)
                            .withGetter("finger", () => staticRegion.finger)
                            .withGetterAndSetter("state",
                                function() { return this.dataset.state; },
                                function(state) {
                                    if(Regions.States.isValid(state)) {
                                        this.dataset.state = state;}})
                            .withChild(Regions.FingerLabel.instantiate(staticRegion))
                            .withChildren(joints)
                            .withAttributeChangeListener("data-state",
                                function(e) {
                                    //Is the new state valid?
                                    if (! Regions.States.isValid(e.value)) {
                                        //No - reset to the old value and return
                                        return e.region.state = e.oldValue; }
                                    //Valid. Is this an exclusive state?
                                    if (["preview", "selected"].includes(e.value)) {
                                        //Yes. If there's another region with the exclusive state,
                                        //switch it to 'unselected'.
                                        this.parentElement.regions
                                            .filter(region => region.state === e.value)
                                            .filter(region => region.finger !== this.finger)
                                            .forEach(region => region.state = "unselected");}
                                    //Is it the selected state?
                                    if("selected" === e.value) {
                                        //Yes. Notify the regionChangeObservers.
                                        regionChangeObserver(this.finger);}
                                    //Style the region according to the new state.
                                    const fingerLabel = this.querySelector(`.finger-label`);
                                    const fingerLabelOutline = fingerLabel.querySelector("circle");
                                    //Hide the label if 'unselectable'
                                    fingerLabel.setAttribute("display",
                                        "unselectable" === e.value ? "none" : "inline");
                                    //Show the stroke if 'preview' or 'selected'
                                    fingerLabelOutline.setAttribute("stroke",
                                        ["preview", "selected"].includes(e.value) ? "black" : "none");
                                    //Dash the stroke if 'preview'
                                    fingerLabelOutline.setAttribute("stroke-dasharray",
                                        "preview" === e.value ? "4 5" : null);},
                                function() {return this.state;})
                            .withDataAttribute("state",
                                staticRegion.finger === Fingers.index ? "selected" : "unselected")})
                    .withGetterAndSetter("state",
                        function() { return this.element.state; },
                        function(state) { this.element.state = state});})};
        return {
            Style: {
                width: 237},
            Builder: {
                withRegionChangeObserver: (observer) => {
                    const regions = Regions.Builder.Instance.withRegionChangeObserver(observer);
                    const regionWithFinger = (finger) => regions.find(region => region.finger === finger);
                    const mouseEventToClosestFinger = (e) => regions
                        .map(region => ({
                            finger: region.finger,
                            distance2: region.distance2Mapper([e.clientX, e.clientY])}))
                        .reduce((closestRegion, currentRegion) =>
                            closestRegion.distance2 <= currentRegion.distance2 ?
                                closestRegion : currentRegion)
                        .finger;
                return SVG.Builder
                    .G()
                    .withAttributes({
                        cursor: "pointer",
                        pointerEvents: "fill",
                        width: 233,
                        height: 291 })
                    .withClass("finger-input")
                    .withChild(SVG.Builder.Path
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
                        .withAttribute("class", "outline"))
                    .withChildren(regions.map(region => region.element))
                    .withMethods({
                        withFinger: function(finger) {
                            this.selected = finger;
                            return this;},
                        unpreview: function() {
                            const previewFinger = this.preview;
                            if(! Objects.isNil(previewFinger)) {
                                this.setFingerState(previewFinger, "unselected"); } },
                        unselect: function() {
                            const selectedFinger = this.selected;
                            if(! Objects.isNil(selectedFinger)) {
                                this.setFingerState(selectedFinger, "unselected"); } },
                        getFingerState: function(finger) { return regionWithFinger(finger).state; },
                        setFingerState: function(finger, state) { regionWithFinger(finger).state = state; },
                        getFingerWithExclusiveState: (state) => {
                            const matchingRegion = regions.find(region => region.state === state);
                            return matchingRegion === undefined ? null : matchingRegion.finger;}})
                    .withEventListeners({
                        mouseMove: function(e) {
                            const previewFinger = mouseEventToClosestFinger(e);
                            //Set the cursor to 'auto' if the preview region is 'unselectable',
                            //otherwise 'pointer'.
                            this.setAttribute("cursor",
                                "unselectable" === this.getFingerState(previewFinger) ?
                                    "auto" : "pointer");
                            //Set the preview
                            this.preview = previewFinger;},
                        mouseDown: function(e) {this.selected = mouseEventToClosestFinger(e);},
                        mouseLeave: function() {this.unpreview();}})
                    //Add a `${region.finger.name}` getter and setter per region to get its state
                    .withGettersAndSetters(regions.map(region => ({
                        key: region.finger.name,
                        get: () => region.state,
                        set: (state) => region.state = state})))
                    .withProperties({
                        regions: {
                            get: () => regions.map(region => ({
                                finger: region.finger,
                                state: region.state}))},
                        selected: {
                            get: function() { return this.getFingerWithExclusiveState("selected"); },
                            set: function(finger) {
                                //Unselect if null or undefined
                                if(Objects.isNil(finger)) {
                                    return this.unselect(); }

                                //Get the newly selected region state
                                const selectedFingerCurState = this.getFingerState(finger);
                                //Is it unselectable or already selected?
                                if(["unselectable", "selected"].includes(selectedFingerCurState)) {
                                    //Yes. Do nothing.
                                    return; }

                                //Get the previously selected region
                                const previouslySelectedFinger = this.selected;
                                //Does one exist?
                                if(previouslySelectedFinger !== null) {
                                    //Yes. Unselect it.
                                    this.setFingerState(previouslySelectedFinger,
                                        "unselected"); }

                                //Select the new finger
                                this.setFingerState(finger, "selected") } },
                        preview: {
                            get: function() {
                                return this.getFingerWithExclusiveState("preview");},
                            set: function(finger) {
                                //Unpreview if null or undefined
                                if(Objects.isNil(finger)) {return this.unpreview(); }
                                //Get the current preview region (possibly undefined)
                                const existingPreviewFinger = this.preview;
                                //Does one exist, and if so does it differ from
                                //the current preview finger?
                                if(! [null, finger].includes(existingPreviewFinger)){
                                    //Yes. Unselect it.
                                    this.setFingerState(existingPreviewFinger, "unselected"); }
                                //Is the new region unselected?
                                if(this.getFingerState(finger) === "unselected") {
                                    //Yes. Preview it.
                                    //(only unselected regionInfo can be previewed)
                                    this.setFingerState(finger, "preview"); } } } })
                    .disableTextSelection();}}}; });

    const ShapeChart = Module.of(() => {
        const halfRoot2 = .5 * Math.SQRT2;
        const FingerlessIndicator = {
            Style: {
                radius: 5,
                margin: 2 }};
        FingerlessIndicator.Style.diameter = 2 * FingerlessIndicator.Style.radius;
        FingerlessIndicator.Builder = Module.of(() => {
            const DeadStringBuilder = {
                withCenter: (center) => SVG.Builder.Path
                    .withD(
                        `M
                            ${center[0] - FingerlessIndicator.Style.radius * halfRoot2},
                            ${center[1] - FingerlessIndicator.Style.radius * halfRoot2}
                        l
                            ${FingerlessIndicator.Style.diameter * halfRoot2},
                            ${FingerlessIndicator.Style.diameter * halfRoot2}
                        m
                            0,
                            ${-FingerlessIndicator.Style.diameter * halfRoot2}
                        l
                            ${-FingerlessIndicator.Style.diameter * halfRoot2},
                            ${FingerlessIndicator.Style.diameter * halfRoot2}`)
                    .withClass("dead-string-indicator")};
            const OpenStringBuilder = {
                withCenter: (center) => SVG.Builder.Circle
                    .withCenter(center)
                    .withRadius(FingerlessIndicator.Style.radius)
                    .withClass("open-string-indicator")};
            return {
                forString: (string) => {
                    const centerX = FingerlessIndicator.Style.startX + ((string - 1) * Fretboard.Style.stringSpacing);
                    const centerTop = [
                        centerX,
                        FingerlessIndicator.Style.startY + FingerlessIndicator.Style.radius];
                    return {
                        topOnly: {
                            dead: () => DeadStringBuilder.withCenter(centerTop),
                            open: () => OpenStringBuilder.withCenter(centerTop)},
                        topAndBottom: ({
                            withMaxActiveRelativeFret: (relativeFret) => {
                                const centerBottom = [
                                    centerX,
                                    Fretboard.fretToYCoordinate(
                                        (relativeFret === undefined ? 0 : relativeFret) + .5) +
                                        FingerlessIndicator.Style.radius + FingerlessIndicator.Style.margin];
                                return {
                                    dead: () => SVG.Builder.G()
                                        .withClass("dead-string-indicators")
                                        .withChild(DeadStringBuilder.withCenter(centerTop))
                                        .withChild(DeadStringBuilder.withCenter(centerBottom)),
                                    open: () => SVG.Builder.G()
                                        .withClass("open-string-indicators")
                                        .withChild(OpenStringBuilder.withCenter(centerTop))
                                        .withChild(OpenStringBuilder.withCenter(centerBottom))};}})};}};});
        const RootFretLabel = {
            Style: {
                paddingRight: 5,
                textLength: 18, //hardcoded
                fontSize: 15,
                fontFamily: "monospace" }};
        const FingerIndicator = {
            Style: { radius: 11 } };
        const ShapeChartStyle = {
            padding: {
                x: RootFretLabel.Style.textLength +
                    RootFretLabel.Style.paddingRight +
                    FingerIndicator.Style.radius,
                y: Style.stroke.halfWidth + FingerlessIndicator.Style.radius } };
        FingerlessIndicator.Style.startX = ShapeChartStyle.padding.x;
        FingerlessIndicator.Style.startY = ShapeChartStyle.padding.y;
        FingerIndicator.Style.diameter = 2 * FingerIndicator.Style.radius;
        const FingerActions = {
            Builder: {
                withFinger: (finger) => ({
                    atRootFret: (fret) => ({
                        fromString: (fromString) => ({
                            toString: (toString) => ({
                                finger: finger,
                                fret: fret,
                                range: Strings.range(fromString, toString)})})})})},
            sameFingerAndFret: (a, b) => a.finger === b.finger && a.fret === b.fret};
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
                        y: Fretboard.fretToYCoordinate(fingerAction.fret),
                        dominantBaseline: "central",
                        textAnchor: "middle",
                        stroke: "none",
                        fill: Style.colors.superLight,
                        fontSize: 17}))};
        RootFretLabel.Builder = Module.of(() => {
            const forText = (text) => {
                const label = SVG.Builder.Text
                    .withTextContent(text)
                    .withClass("r-label")
                    .moveTo(
                        Fretboard.stringToXCoordinate(1) -
                            FingerIndicator.Style.radius -
                            RootFretLabel.Style.paddingRight,
                        Fretboard.fretToYCoordinate(Frets.Relative.first))
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
                fixed: (fret) => forText(`${fret}`),
                unfixed: () => forText("r") }; });

        //The 'skeleton' consists of the passive portion of the ShapeFilterView -
        //fretboard and finger indicator placeholders.
        const skeletonBuilder = () => SVG.Builder
            .G()
            .withClass("shape-chart-skeleton")
            .withAttribute("stroke", Style.colors.light)
            .withChild(SVG.Builder
                .G()
                .withClass("fingerless-indicators")
                .withChildren(Strings.all
                    .map((string) => FingerlessIndicator.Builder.forString(string).topOnly)
                    .map(fingerIndicatorBuilder => [
                        fingerIndicatorBuilder.open(),
                        fingerIndicatorBuilder.dead()])
                    .flat()))
            .withChild(SVG.Builder
                .G()
                .withClass("fretboard")
                .withChildren(Strings.all.map(string => Fretboard.StringLineBuilder
                    .forString(string)
                    .toFret(Frets.Relative.last)))
                .withChildren(Numbers.range(Frets.Relative.first, Frets.Relative.last + 2)
                    .map(belowFret => Fretboard.FretDividerBuilder
                        .belowFret(belowFret)
                        .fromString(Strings.first)
                        .toString(Strings.last))));

        //The 'meat' consists of the active portion of the ShapeFilterView -
        // darkened fretboard strings and finger indicators.
        const Meat = {
            Builder: {
                forShape: (shape) => {
                    const fingeredStringActions = shape.filter(Shapes.StringAction.isFingered);
                    const maxFret = fingeredStringActions.length === 0 ? undefined : fingeredStringActions
                        .map(stringAction => stringAction.fret)
                        .reduce((a, b) => a >= b ? a : b);
                    const activeStringActions = shape
                        .map((action, index) => ({
                            string: index + 1,
                            action: action}))
                        .filter(stringAction => stringAction.action !== Shapes.StringAction.unsounded);
                    const meat = SVG.Builder
                        .G()
                        .withAttribute("stroke", Style.colors.heavy)
                        .withClass("shape-chart-meat");
                    if(maxFret !== undefined) {meat
                        //Active strings
                        .withChildren(activeStringActions
                            .map(stringAction => Fretboard.StringLineBuilder
                                .forString(stringAction.string)
                                .toFret(maxFret)
                                .withAttribute("strokeWidth", 1.5)))
                        //Active frets dividers
                        .withChildren(Numbers.range(Frets.Relative.first, maxFret + 2).map(belowFret =>
                            Fretboard.FretDividerBuilder
                                .belowFret(belowFret)
                                .fromString(activeStringActions[0].string)
                                .toString(activeStringActions[activeStringActions.length-1].string)
                                .withAttribute("strokeWidth", 1.5)))}
                    return activeStringActions.length === 0 ? meat : meat
                        //Open strings indicators
                        .withChildren(activeStringActions
                            .filter(stringAction => stringAction.action === Shapes.StringAction.open)
                            .map(stringAction => FingerlessIndicator.Builder
                                .forString(stringAction.string)
                                .topAndBottom
                                .withMaxActiveRelativeFret(maxFret)
                                .open()
                                .withAttribute("stroke", Style.colors.black)))
                        //Dead strings indicators
                        .withChildren(activeStringActions
                            .filter(stringAction => Shapes.StringAction.isDeadened(stringAction.action))
                            .map(stringAction => stringAction.string)
                            .map(deadString => FingerlessIndicator.Builder
                                .forString(deadString)
                                .topAndBottom
                                .withMaxActiveRelativeFret(maxFret)
                                .dead()
                                .withAttribute("stroke", Style.colors.black)))
                        //Finger indicators
                        .withChildren(activeStringActions
                            //Filter out open strings
                            .filter(stringAction => stringAction.action !== Shapes.StringAction.open)
                            //Convert to finger actions, merging ones with the same finger and fret
                            .reduce(
                                ((stringActionToFingerAction = (stringAction) => FingerActions.Builder
                                    .withFinger(stringAction.action.finger)
                                    .atRootFret(stringAction.action.fret)
                                    .fromString(stringAction.string)
                                    .toString(stringAction.string)
                                ) => (fingerActions, stringAction) => fingerActions.length === 0 ?
                                    [stringActionToFingerAction(stringAction)] :
                                    ((indexMatchingFingerAction=fingerActions.findIndex(fingerAction =>
                                        FingerActions.sameFingerAndFret(fingerAction, stringAction.action))) =>
                                        indexMatchingFingerAction === -1 ?
                                            fingerActions.concat(stringActionToFingerAction(stringAction)) :
                                            Arrays.updateItem(
                                                fingerActions,
                                                indexMatchingFingerAction,
                                                (fingerAction) => fingerAction.range.max = stringAction.string))())(),
                                [])
                            .map(fingerAction => FingerIndicator.Builder.forFingerAction(fingerAction)) )}}};
        Meat.Builder.blank = () => Meat.Builder.forShape(Shapes.Schema.allUnsounded);
        const containerBuilder = () => SVG.Builder
            .G()
            .withClass("shape-chart")
            .disableTextSelection()
            .withChild(skeletonBuilder())
            //data-shape
            .withGetterAndSetter("shape",
                function() { return this.dataset.shape; },
                function(shape) { this.dataset.shape = shape; })
            .withGetterAndSetter("r",
                function() { return this.dataset.r; },
                function(r) {this.dataset.r = r; })
            .withAttributeChangeListeners({
                "data-shape":  {
                    listener: function(e) {
                        this.querySelector(".shape-chart-meat")
                            .replaceWith(Meat.Builder.forShape(
                                Shapes.Schema.fromString(e.value)))},
                    attributeExtractor: function() {return this.shape;}},
                "data-r": {
                    listener: Module.of(() => {
                        const isValidR = (r) => Numbers.range(Frets.first, Frets.maxRoot + 1)
                            .map(fret => `${fret}`)
                            .includes(r);
                        return function(e) {
                            const rootLabel = this.querySelector(".r-label");
                            if([undefined, null, "", "null"].includes(e.value)) {
                                rootLabel.textContent = "r";}
                            else if(isValidR(e.value)) {
                                rootLabel.textContent = e.value;}
                            else {
                                this.r = e.oldValue; }}})}});
        return {
            Style: {
                width: Fretboard.Style.startX +
                    Fretboard.Style.width +
                    FingerIndicator.Style.radius,
                height: Fretboard.Style.startY + Fretboard.Style.height},
            Meat: Meat,
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
            Builder: Module.of(() => {
                const fixednessStep = (shapeChart) => ({
                    fixed: (fret) => shapeChart
                        .withChild(RootFretLabel.Builder.fixed(fret))
                        .withDataAttribute("r", fret),
                    unfixed: () => shapeChart
                        .withChild(RootFretLabel.Builder.unfixed())
                        .withDataAttribute("r", null)});
                const forShape = (shape) => fixednessStep(
                    containerBuilder()
                        .withChild(Meat.Builder.forShape(shape))
                        .withDataAttribute("shape", Shapes.Schema.toString(shape)));
                return {
                    blank: () => forShape(Shapes.Schema.allUnsounded),
                    forShape: forShape };})};});
    const ShapeInput = Module.of(() => {
        const shapeChartMarginRight = 2;
        const fingerInputScale = .5;
        const initialActiveFinger = Fingers.index;
        const FretboardMouseTrap = {
            Style: {padding: ShapeChart.FingerIndicator.Style.radius}};
        FretboardMouseTrap.xCoordinateToString = (x) => Strings.all
            .map(string => ({
                string: string,
                distanceXToMouse: Math.abs(x -
                    FretboardMouseTrap.Style.padding -
                    ShapeChart.Fretboard.Style.stringSpacing * (string - 1))}))
            .reduce((a, b) => a.distanceXToMouse <= b.distanceXToMouse ? a : b)
            .string;
        FretboardMouseTrap.yCoordinateToFret = (y) => Frets.Relative.all
            .map(fret => ({
                fret: fret,
                distanceYToMouse: Math.abs(y -
                    FretboardMouseTrap.Style.padding -
                    ShapeChart.Fretboard.Style.fretHeight * (fret - .5))}))
            .reduce((a, b) => a.distanceYToMouse <= b.distanceYToMouse ? a : b)
            .fret;
        const FingerlessIndicatorMouseTrap = {
            Style: {
                padding: {
                    horizontal: ShapeChart.FingerIndicator.Style.radius,
                    vertical: 7}}};
        FingerlessIndicatorMouseTrap.xCoordinateToString = (x) => Strings.all
            .map(string => ({
                string: string,
                distanceXToMouse: Math.abs(x -
                    FingerlessIndicatorMouseTrap.Style.padding.horizontal -
                    ShapeChart.FingerlessIndicator.Style.radius -
                    ShapeChart.Fretboard.Style.stringSpacing * (string - 1))}))
            .reduce((a, b) => a.distanceXToMouse <= b.distanceXToMouse ? a : b)
            .string;
        const MouseTrapsBuilder = {
            withShapeChart: (shapeChart) => {
                shapeChart
                    .withDataAttribute("activeFinger", initialActiveFinger.label)
                    .withGetterAndSetter("activeFinger",
                        function() {return Fingers.all.find(finger => finger.label === this.dataset.activeFinger);},
                        function(activeFinger) {this.dataset.activeFinger = activeFinger.label;});
                return {
                    withPreviewMeatContainer: (previewMeatContainer) => {
                        let dragAction = null;
                        const dragActive = () => dragAction !== null;
                        let currentTarget = null;
                        const isInside = () => currentTarget !== null;

                        const mouseTrapEventListeners = {
                            withMousePositionToShapeFunction: (mousePositionToShape) => {
                                let mouseUpEventHandler = function(e) {
                                    dragAction = null;
                                    shapeChart.preview = mousePositionToShape([e.offsetX, e.offsetY]).shape;
                                    if(isInside()) previewMeatContainer.show(); else previewMeatContainer.hide();
                                    window.removeEventListener("mouseup", this);};
                                mouseUpEventHandler.bind(mouseUpEventHandler);
                                return {
                                    mouseenter: (e) => {
                                        if(dragActive()) return;
                                        shapeChart.preview = mousePositionToShape([e.offsetX, e.offsetY]).shape;
                                        previewMeatContainer.show(); },
                                    mousemove: (e) => {
                                        currentTarget = e.target;
                                        if(dragActive()) {
                                            shapeChart.shape = mousePositionToShape([e.offsetX, e.offsetY]).shape;}
                                        else {
                                            shapeChart.preview = mousePositionToShape([e.offsetX, e.offsetY]).shape;}},
                                    mousedown: (e) => {
                                        if(e.button !== 0) return;
                                        const shapeInfo = mousePositionToShape([e.offsetX, e.offsetY]);
                                        shapeChart.shape = shapeInfo.shape;
                                        dragAction = shapeInfo.change;
                                        previewMeatContainer.hide();
                                        window.addEventListener("mouseup", mouseUpEventHandler)},
                                    mouseout: () => {
                                        previewMeatContainer.hide();
                                        currentTarget = null;}};}};
                        const mouseTraps =  {
                            fretboard: Module.of(() => {
                                let previousMousePosition = [0,0];
                                const mousePositionToShapeFunction = (p) => {
                                    previousMousePosition = p;
                                    const previewShape = Shapes.Schema.fromString(shapeChart.shape).slice();
                                    const previewString = FretboardMouseTrap.xCoordinateToString(p[0]);
                                    const previewFret = FretboardMouseTrap.yCoordinateToFret(p[1]);
                                    const previewFinger = shapeChart.activeFinger.label;
                                    const currentAction = previewShape[previewString - 1];
                                    previewShape[previewString - 1] = dragActive() ? (
                                            Shapes.StringAction.isFingerless(dragAction) ?
                                                dragAction :
                                                dragAction.sounded === true ?
                                                    Shapes.StringAction.fingered(previewFret, previewFinger) :
                                                    Shapes.StringAction.deadened(previewFret, previewFinger)) :
                                        Shapes.StringAction.isFingerless(currentAction) ||
                                        currentAction.finger !== previewFinger ||
                                        currentAction.fret !== previewFret ?
                                            Shapes.StringAction.fingered(previewFret, previewFinger) : (
                                                currentAction.sounded === true ?
                                                    Shapes.StringAction.deadened(previewFret, previewFinger) :
                                                    Shapes.StringAction.unsounded);
                                    return {
                                        change: previewShape[previewString - 1],
                                        shape: Shapes.Schema.toString(previewShape)};};
                                return SVG.Builder.MouseTrap
                                    .withX(ShapeChart.Fretboard.Style.x - FretboardMouseTrap.Style.padding)
                                    .withY(ShapeChart.Fretboard.Style.y - FretboardMouseTrap.Style.padding)
                                    .withWidth(ShapeChart.Fretboard.Style.width + 2 * FretboardMouseTrap.Style.padding)
                                    .withHeight(ShapeChart.Fretboard.Style.height + 2 * FretboardMouseTrap.Style.padding)
                                    .withClass("fretboard-mouse-trap")
                                    .withDataAttribute("preview", shapeChart.shape)
                                    .withEventListeners(mouseTrapEventListeners.withMousePositionToShapeFunction(
                                        mousePositionToShapeFunction))
                                    .withMethod("updatePreview", function() {
                                        if(currentTarget === mouseTraps.fretboard && ! dragActive()) {
                                            shapeChart.preview = mousePositionToShapeFunction(previousMousePosition)
                                                .shape;}});}),
                            fingerlessIndicators: SVG.Builder.MouseTrap
                                .withX(ShapeChart.FingerlessIndicator.Style.startX  -
                                    FingerlessIndicatorMouseTrap.Style.padding.horizontal)
                                .withY(ShapeChart.FingerlessIndicator.Style.startY -
                                    FingerlessIndicatorMouseTrap.Style.padding.vertical)
                                .withWidth(ShapeChart.Fretboard.Style.width +
                                    ShapeChart.FingerlessIndicator.Style.diameter +
                                    2 * FingerlessIndicatorMouseTrap.Style.padding.horizontal)
                                .withHeight(ShapeChart.FingerlessIndicator.Style.diameter +
                                    ShapeChart.FingerlessIndicator.Style.margin +
                                    FingerlessIndicatorMouseTrap.Style.padding.vertical)
                                .withClass("fingerless-indicators-mouse-trap")
                                .withEventListeners(mouseTrapEventListeners
                                    .withMousePositionToShapeFunction((p) => {
                                        const activeShape = Shapes.Schema.fromString(shapeChart.shape);
                                        const previewShape = activeShape.slice();
                                        const previewString = FingerlessIndicatorMouseTrap.xCoordinateToString(p[0]);
                                        previewShape[previewString - 1] = dragActive() ? (
                                            Shapes.StringAction.isFingerless(dragAction) ? dragAction :
                                                previewShape[previewString -1]) : Module.of(() => {
                                            const previousStringAction = activeShape[previewString - 1];
                                            return previousStringAction === Shapes.StringAction.unsounded ?
                                                Shapes.StringAction.open :
                                                Shapes.StringAction.unsounded;});
                                        return {
                                            change: previewShape[previewString - 1],
                                            shape: Shapes.Schema.toString(previewShape)};}))};
                        shapeChart.withAttributeChangeListener("data-active-finger",
                            function() {
                                mouseTraps.fretboard.updatePreview();},
                            function() { return this.activeFinger; });
                        return mouseTraps; }};}};
        const RootFretRangeInput = Module.of(() => {
            const RootFretRangeStyle = Module.of((
                marginTop = 29,
                startX = ShapeChart.Fretboard.Style.x,
                endX = startX + (ShapeChart.Fretboard.Style.stringSpacing *
                    (Frets.roots.length - 1)),
                width = endX - startX,
                rangeMarkerRadius=11,
                tickRadius = (3/8) * rangeMarkerRadius,
                mouseTrapHorizontalPadding = rangeMarkerRadius
            ) => ({
                startX: startX,
                endX: endX,
                y: ShapeChart.Style.height + marginTop,
                width: width,
                height: 2 * tickRadius,
                normalStrokeWidth: 1,
                emphasisStrokeWidth: 1.5,
                activeStrokeWidth: 2,
                tickRadius: tickRadius,
                rangeLabelFontSize: 13,
                rangeLabelFont: "Courier New",
                rangeLabelHalfHeight: 9,
                rangeLabelMarginTop: 16,
                rangeLabelTextSpacing: 40,
                mouseTrapHorizontalPadding: mouseTrapHorizontalPadding,
                mouseTrapWidth: width + 2 * mouseTrapHorizontalPadding,
                mouseTrapHeight: 2 * rangeMarkerRadius,
                tickSpacing: width / (Frets.roots.length - 1),
                rangeMarkerRadius: rangeMarkerRadius}));
            const rootFretToXCoordinate = (rootFret) => (rootFret-1) * RootFretRangeStyle.tickSpacing;
            const rootFretXCoordinates = Frets.roots.map(rootFret => ({
                rootFret: rootFret,
                x: rootFretToXCoordinate(rootFret)}));
            const xCoordinateToRootFret = Module.of((
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
                    candidates[0].rootFret) => (x) => binarySearch(rootFretXCoordinates, x));
            const RootFretRangeInputBuilders = {
                Baseline: () => SVG.Builder.Line
                    .withEndpoints(
                        [0, 0],
                        [RootFretRangeStyle.width, 0])
                    .withClass("root-fret-range-input-baseline")
                    .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth),
                ActiveBaseline: () => SVG.Builder.Line
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
                Skeleton: {
                    withBaselines: (baseline, activeBaseline,
                        rootFretXCoordinateToTick=(rootFretXCoordinate) => SVG.Builder.Line
                            .withEndpoints(
                                [rootFretXCoordinate.x, -RootFretRangeStyle.tickRadius],
                                [rootFretXCoordinate.x, RootFretRangeStyle.tickRadius])
                            .withClass("root-fret-range-tick")
                            .withDataAttribute("value", rootFretXCoordinate.rootFret),
                        rootFretTicks=rootFretXCoordinates.reduce(
                            (tickMap, rootFretXCoordinate) => {
                                tickMap[rootFretXCoordinate.rootFret] = rootFretXCoordinateToTick(rootFretXCoordinate);
                                return tickMap;},
                            {})) => SVG.Builder.G()
                                .withClass("root-fret-range-skeleton")
                                .withChild(baseline)
                                .withChild(activeBaseline)
                                .withChild(SVG.Builder.G()
                                    .withClass("root-fret-range-ticks")
                                    .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth)
                                    .withChildren(Object.values(rootFretTicks)))
                                .withMethods(
                                    Module.of((
                                        activeRootFrets=[],
                                        setNewActives=(actives) => {
                                            activeRootFrets.forEach(rootFret =>
                                                rootFretTicks[rootFret].withAttribute(
                                                    "stroke-width", RootFretRangeStyle.normalStrokeWidth));
                                            activeRootFrets = actives;
                                            activeRootFrets.forEach((rootFret) =>
                                                rootFretTicks[rootFret].withAttribute(
                                                    "stroke-width", RootFretRangeStyle.activeStrokeWidth));}
                                    ) => ({
                                        activateMinAndMax: (min, max) => setNewActives([min, max]),
                                        activatePivot: (pivot) => setNewActives([pivot])})))},
                RangeLabel: Module.of((
                    createText=() => SVG.Builder.Text
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
                        .move(RootFretRangeStyle.rangeLabelTextSpacing, 0)) =>
                    () => SVG.Builder.G()
                        .withClass("root-fret-range-input-label")
                        .withChildren([minText, expressionText, maxText])
                        .disableTextSelection()
                        .moveTo(.5 * RootFretRangeStyle.width,
                            RootFretRangeStyle.height + RootFretRangeStyle.rangeLabelMarginTop)
                        .withMethods({
                            withRange: function(minRootFret, maxRootFret) {
                                minText.withTextContent(minRootFret);
                                maxText.withTextContent(maxRootFret);
                                return this;},
                            withValue: function(rootFret) {
                                return this.withRange(rootFret, rootFret);}})),
                RangeMarkers: Module.of((
                    rootFretToCenter=(rootFret)=>[rootFretToXCoordinate(rootFret), 0],
                    markerForType = (markerType) => SVG.Builder.Circle
                        .withCenter([0,0])
                        .withRadius(RootFretRangeStyle.rangeMarkerRadius)
                        .withClass("root-fret-range-marker")
                        .withAttributes({
                            cursor: "pointer",
                            pointerEvents: "all",
                            strokeWidth: RootFretRangeStyle.normalStrokeWidth,
                            fill: "none"})
                        .withDataAttribute("markerType", markerType)
                        .withDataAttribute("rootFret", null)
                        .withGetterAndSetter("rootFret",
                            function() {return Number.parseInt(this.dataset.rootFret);},
                            function(rootFret) {this.dataset.rootFret = rootFret;})
                        .withMethod("atRootFret", function(rootFret) {
                            const center = rootFretToCenter(rootFret);
                            return this
                                .withDataAttribute("rootFret", rootFret)
                                .withAttributes({
                                    cx: center[0],
                                    cy: center[1]});})
                        .hide()
                ) => () => {
                    const markers = {
                        min: markerForType("min"),
                        max: markerForType("max"),
                        pivot: markerForType("pivot"),
                        preview: markerForType("preview").withAttributes({
                            strokeDasharray: "3 4",
                            pointerEvents: "none"})};
                    markers.minAndMax = [markers.min, markers.max];
                    markers.all = [markers.preview,   //preview goes first so it is behind others
                        markers.min, markers.max, markers.pivot];
                    return markers;}),
            MouseTrap: () => SVG.Builder.MouseTrap
                .withX(-RootFretRangeStyle.mouseTrapHorizontalPadding)
                .withY(-.5 * RootFretRangeStyle.mouseTrapHeight)
                .withWidth(RootFretRangeStyle.mouseTrapWidth)
                .withHeight(RootFretRangeStyle.mouseTrapHeight)
                .withClass("root-fret-range-mouse-trap")};
            RootFretRangeInputBuilders.RootFretRangeInput = Module.of((
                setupEventHandlers = (rangeMarkers, baseline, activeBaseline, rangeLabel, mouseTrap, Range) => {
                    const activateMarker = (marker) => marker.withAttribute(
                        "stroke-width", RootFretRangeStyle.activeStrokeWidth)
                    const emphasizeMarker = (marker) => marker.withAttribute(
                        "stroke-width", RootFretRangeStyle.emphasisStrokeWidth);
                    const unemphasizeMarker = (marker) => marker.withAttribute(
                        "stroke-width", RootFretRangeStyle.normalStrokeWidth);
                    const States = {
                        extremaInactive: {},
                        extremumDragging: {},
                        maxDragging: {},
                        pivot: {},
                        pivotInactive: {}};
                    const mouseEventToRootFret = (e) => xCoordinateToRootFret(
                        MouseEvents.relativeMousePosition(e, baseline)[0]);
                    const emphasizeMarkerIfMouseOnRootFret = (marker, mouseEvent,
                        relativeMousePosition=MouseEvents.relativeMousePosition(mouseEvent, mouseTrap)
                    ) => Functions.ifThenElse(
                        mouseEventToRootFret(mouseEvent) !== marker.rootFret ||
                        relativeMousePosition[0] < 0 ||
                        relativeMousePosition[1] < 0 ||
                        relativeMousePosition[0] > RootFretRangeStyle.mouseTrapWidth ||
                        relativeMousePosition[1] > RootFretRangeStyle.mouseTrapHeight,
                        () => unemphasizeMarker(marker),
                        () => emphasizeMarker(marker));
                    let previewRootFret = null;
                    const setPreviewRootFret = (rootFret) => {
                        previewRootFret = rootFret;
                        rangeMarkers.preview.atRootFret(rootFret);};
                    const inactivateRangeMouseMove = (e, relevantMarkers,
                                                      rootFret=mouseEventToRootFret(e)) => {
                        relevantMarkers.forEach(marker =>
                            emphasizeMarkerIfMouseOnRootFret(marker, e));
                        Functions.ifThen(
                            rootFret !== previewRootFret,
                            () => setPreviewRootFret(rootFret))};
                    const inactiveRangeMouseEnter = (e, relevantMarkers) => {
                        rangeMarkers.preview.show();
                        inactivateRangeMouseMove(e, relevantMarkers); };
                    const inactiveRangeMouseLeave = () => {
                        rangeMarkers.preview.hide();
                        rangeMarkers.minAndMax.concat(rangeMarkers.pivot).forEach(marker =>
                            unemphasizeMarker(marker));};
                    Objects.using(States.extremaInactive).withFields(Module.of(() => {
                        let deactivate;
                        const markerMouseEnter = (marker, rootFret) => {
                            setPreviewRootFret(rootFret);
                            emphasizeMarker(marker);};
                        const markerMouseLeave = (marker) => unemphasizeMarker(marker);
                        const rangeEventListeners = {
                            mouseEnter: (e) => inactiveRangeMouseEnter(e, rangeMarkers.minAndMax),
                            mouseMove: (e) => inactivateRangeMouseMove(e, rangeMarkers.minAndMax),
                            mouseDown: (e) => {
                                deactivate();
                                Range.set(mouseEventToRootFret(e));
                                States.pivot.activate();},
                            mouseLeave: inactiveRangeMouseLeave};
                        const minMarkerEventListeners = {
                            mouseEnter: () => markerMouseEnter(rangeMarkers.min, rangeMarkers.min.rootFret),
                            mouseLeave: () => markerMouseLeave(rangeMarkers.min),
                            mouseDown: () => {
                                deactivate();
                                States.extremumDragging.activate().forMin()}};
                        const maxMarkerEventListeners = {
                            mouseEnter: () => markerMouseEnter(rangeMarkers.max, rangeMarkers.max.rootFret),
                            mouseLeave: () => markerMouseLeave(rangeMarkers.max),
                            mouseDown: () => {
                                deactivate();
                                States.extremumDragging.activate().forMax();}};
                        deactivate = () => {
                            mouseTrap.withoutEventListeners(rangeEventListeners);
                            rangeMarkers.min.withoutEventListeners(minMarkerEventListeners);
                            rangeMarkers.max.withoutEventListeners(maxMarkerEventListeners);};
                        return {
                            activate: () => {
                                mouseTrap.withEventListeners(rangeEventListeners);
                                rangeMarkers.min.withEventListeners(minMarkerEventListeners);
                                rangeMarkers.max.withEventListeners(maxMarkerEventListeners);}};}));
                    Objects.using(States.extremumDragging).withFields(Module.of(() => {
                        const internalState = Objects.using({
                            activeRangeMarker: null,
                            activeRootFret: null,
                            inactiveRootFret: null,
                            polarity: null });
                        let deactivate;
                        const mouseMoveHandler = (e,
                            rootFret = mouseEventToRootFret(e),
                            getRange = (rootFret) => internalState.polarity === 1 ?
                                [internalState.inactiveRootFret, rootFret] :
                                [rootFret, internalState.inactiveRootFret]
                        ) => Functions.ifThenElse(
                            //Did the active marker drag onto or cross the inactive marker?
                            internalState.polarity * (rootFret - internalState.inactiveRootFret) > 0,
                            //No.
                            () => Functions.ifThen(
                                //Is the mouse over a different root fret than the active markers'?
                                rootFret !== internalState.activeRootFret,
                                () => {
                                    internalState.activeRootFret = rootFret;
                                    internalState.activeRangeMarker.atRootFret(rootFret);
                                    Range.set(...getRange(rootFret));}),
                            //Yes.
                            () => {
                                internalState.activeRangeMarker.atRootFret(
                                    internalState.inactiveRootFret);
                                Range.set(internalState.inactiveRootFret);
                                deactivate();
                                States.pivot.activate();});
                        const mouseUpHandler = (e) => {
                            deactivate();
                            emphasizeMarkerIfMouseOnRootFret(internalState.activeRangeMarker, e);
                            States.extremaInactive.activate();};
                        deactivate = () => {
                            window.removeEventListener("mousemove", mouseMoveHandler);
                            window.removeEventListener("mouseup", mouseUpHandler);};
                        const activateExtremum = (activeRangeMarker, inactiveRangeMarker, polarity) => {
                            activateMarker(activeRangeMarker);
                            unemphasizeMarker(inactiveRangeMarker);
                            const activeRootFret = activeRangeMarker.rootFret;
                            const inactiveRootFret = inactiveRangeMarker.rootFret;
                            polarity === -1 ?
                                Range.set(activeRootFret, inactiveRootFret) :
                                Range.set(inactiveRootFret, activeRootFret);
                            internalState.withFields({
                                activeRangeMarker: activeRangeMarker,
                                activeRootFret: activeRootFret,
                                inactiveRootFret: inactiveRootFret,
                                polarity: polarity})};
                        return {
                            activate: () => {
                                window.addEventListener("mousemove", mouseMoveHandler);
                                window.addEventListener("mouseup", mouseUpHandler);
                                rangeMarkers.preview.hide();
                                return {
                                    forMin: () => activateExtremum(
                                        rangeMarkers.min, rangeMarkers.max, -1),
                                    forMax: () => activateExtremum(
                                        rangeMarkers.max, rangeMarkers.min, 1)};}};}));
                    Objects.using(States.pivot).withFields(Module.of(() => {
                        let pivotFret = null;
                        let deactivate;
                        const mouseUp=(e) => {
                            emphasizeMarkerIfMouseOnRootFret(rangeMarkers.pivot, e);
                            deactivate();
                            States.pivotInactive.activate();};
                        const mouseMove = (e, rootFret=mouseEventToRootFret(e)) =>
                            Functions.ifThen(rootFret !== pivotFret, () => {
                                deactivate();
                                Functions.ifThenElse(rootFret < pivotFret,
                                    () => {
                                        Range.set(rootFret, pivotFret);
                                        States.extremumDragging.activate().forMin();},
                                    () => {
                                        Range.set(pivotFret, rootFret);
                                        States.extremumDragging.activate().forMax();})});
                        deactivate=() => {
                            window.removeEventListener("mouseup", mouseUp);
                            window.removeEventListener("mousemove", mouseMove);};
                        return {
                            activate: () => {
                                pivotFret = rangeMarkers.pivot.rootFret;
                                activateMarker(rangeMarkers.pivot);
                                rangeMarkers.minAndMax.forEach(rangeMarker =>
                                    rangeMarker.atRootFret(pivotFret));
                                rangeMarkers.preview.hide();
                                rangeLabel.withValue(pivotFret);
                                window.addEventListener("mouseup", mouseUp);
                                window.addEventListener("mousemove", mouseMove);}};}));
                    Objects.using(States.pivotInactive).withFields(Module.of(() => {
                        let deactivate;
                        const mouseDown = (e) => {
                            deactivate();
                            Range.set(mouseEventToRootFret(e));
                            States.pivot.activate();};
                        const pivotMouseEvents = {
                            mouseEnter: () => emphasizeMarker(rangeMarkers.pivot),
                            mouseDown: mouseDown,
                            mouseLeave: () => unemphasizeMarker(rangeMarkers.pivot),};
                        const rangeMouseEvents = {
                            mouseEnter: (e) => inactiveRangeMouseEnter(e, [rangeMarkers.pivot]),
                            mouseDown: mouseDown,
                            mouseMove: (e) => inactivateRangeMouseMove(e, [rangeMarkers.pivot]),
                            mouseLeave: inactiveRangeMouseLeave};
                        deactivate = () => {
                            mouseTrap.withoutEventListeners(rangeMouseEvents);
                            rangeMarkers.pivot.withoutEventListeners(pivotMouseEvents);};
                        return {
                            activate: () => {
                                mouseTrap.withEventListeners(rangeMouseEvents);
                                rangeMarkers.pivot.withEventListeners(pivotMouseEvents);}};}));
                    States.extremaInactive.activate();
                }) => {
                    const   baseline = RootFretRangeInputBuilders.Baseline(),
                            activeBaseline = RootFretRangeInputBuilders.ActiveBaseline(),
                            skeleton = RootFretRangeInputBuilders.Skeleton.withBaselines(baseline, activeBaseline),
                            rangeLabel = RootFretRangeInputBuilders.RangeLabel(),
                            rangeMarkers = RootFretRangeInputBuilders.RangeMarkers(),
                            mouseTrap = RootFretRangeInputBuilders.MouseTrap(),
                            Range = Module.of((value)=>({
                                get: () => value,
                                set: (min, max=min) => {
                                    value = [min, max];
                                    Functions.ifThenElse(min !== max,
                                        () => { //min and max
                                            rangeMarkers.minAndMax.forEach(marker =>
                                                marker.show());
                                            rangeMarkers.pivot.hide();
                                            skeleton.activateMinAndMax(min, max);
                                            activeBaseline.show();
                                            rangeLabel.withRange(min, max);
                                            activeBaseline.withRange(min, max);
                                            rangeMarkers.min.atRootFret(min);
                                            rangeMarkers.max.atRootFret(max);},
                                        () => { //pivot
                                            rangeMarkers.pivot.show();
                                            rangeMarkers.minAndMax.forEach(marker => marker.hide());
                                            skeleton.activatePivot(min);
                                            activeBaseline.hide();
                                            rangeLabel.withValue(min);
                                            rangeMarkers.pivot.atRootFret(min);});}}))
                    setupEventHandlers(rangeMarkers, baseline, activeBaseline, rangeLabel, mouseTrap, Range);
                    return () => SVG.Builder.G()
                        .withClass("root-fret-range-input")
                        .moveTo(RootFretRangeStyle.startX, RootFretRangeStyle.y)
                        .withChild(skeleton)
                        .withChild(rangeLabel)
                        .withChild(mouseTrap)
                        .withChild(SVG.Builder.G()
                            .withClass("root-fret-range-markers")
                            .withChildren(rangeMarkers.all))
                        .withGetter("range", () => Range.get())
                        .withMethod("withRange", function(min, max) {
                            Functions.ifThen(
                                min >= Frets.roots.first &&
                                max <= Frets.roots.last &&
                                min <= max,
                                () => Range.set(min, max));
                            return this;})
                        .withRange(Frets.roots.first, Frets.roots.last);});
            return {
                Style: {
                    x: RootFretRangeStyle.startX - RootFretRangeStyle.rangeMarkerRadius,
                    y: RootFretRangeStyle.y - RootFretRangeStyle.rangeMarkerRadius,
                    width: RootFretRangeStyle.width + 2 * RootFretRangeStyle.rangeMarkerRadius,
                    height: 2 * RootFretRangeStyle.height +
                        RootFretRangeStyle.rangeLabelMarginTop +
                        RootFretRangeStyle.rangeLabelHalfHeight},
                Builder: RootFretRangeInputBuilders.RootFretRangeInput};});
        return {
            Style: {
                width: RootFretRangeInput.Style.x + RootFretRangeInput.Style.width,
                height: RootFretRangeInput.Style.y + RootFretRangeInput.Style.height},
            Builder: Module.of(() => {
                const buildStep = (shapeChart) => {
                    const previewMeatContainer = SVG.Builder.G()
                        .withClass("preview-meat-container")
                        .withAttributes({
                            display: "none",
                            fillOpacity: .4,
                            strokeOpacity: .5})
                        .disableTextSelection()
                        .withMethods({
                            show: () => {
                                previewMeatContainer.withoutAttribute("display");
                                shapeChart.querySelector(".shape-chart-meat").withAttributes({
                                    fillOpacity: .6,
                                    strokeOpacity: .5})},
                            hide:() => {
                                previewMeatContainer.withAttribute("display", "none");
                                shapeChart.querySelector(".shape-chart-meat").withoutAttributes(
                                    ["fill-opacity", "stroke-opacity"]);}});
                    shapeChart
                        .withDataAttribute("preview", shapeChart.shape)
                        .withGetterAndSetter("preview",
                            function() {return this.dataset.preview;},
                            function(preview) {this.dataset.preview = preview;})
                        .withAttributeChangeListener("data-preview",
                            function(e) {
                                previewMeatContainer.innerHTML = "";
                                previewMeatContainer.withChild(ShapeChart.Meat.Builder
                                    .forShape(Shapes.Schema.fromString(e.value)));},
                            function() { return this.preview; })
                    const mouseTrapsBuilder = MouseTrapsBuilder
                        .withShapeChart(shapeChart)
                        .withPreviewMeatContainer(previewMeatContainer);
                    const fingerInput = FingerInput.Builder
                        .withRegionChangeObserver((region) => shapeChart.activeFinger = region)
                        .withFinger(initialActiveFinger)
                        .withAttribute("stroke-width", 2)
                        .moveTo(ShapeChart.Style.width + shapeChartMarginRight, ShapeChart.Fretboard.Style.y)
                        .scale(fingerInputScale);
                    const rootFretRangeInput = RootFretRangeInput.Builder();
                    return SVG.Builder.G()
                        .withClass("shape-input")
                        .withChild(shapeChart)
                        .withChild(previewMeatContainer)
                        .withChild(mouseTrapsBuilder.fretboard)
                        .withChild(mouseTrapsBuilder.fingerlessIndicators)
                        .withChild(fingerInput)
                        .withChild(rootFretRangeInput)
                        .withGetterAndSetter("shape",
                            () => shapeChart.shape,
                            (shape) => shapeChart.shape = shape)
                        .withGetterAndSetter("rootFretRange",
                            () => rootFretRangeInput.range,
                            (range) => rootFretRangeInput.withRange(range[0], range[1]))
                        .withMethods(Module.of(() => {  //focus() and unfocus()
                            const keyCommands = Module.of(() => {
                                const command = (finger) => {
                                    shapeChart.activeFinger = finger;
                                    fingerInput.selected = finger;};
                                const keyCommands = {
                                    1: Fingers.index,
                                    2: Fingers.middle,
                                    3: Fingers.ring,
                                    4: Fingers.pinky,
                                    t: Fingers.thumb };
                                Object.entries(keyCommands).forEach(keyFinger =>
                                    keyCommands[keyFinger[0]] = () => command(keyFinger[1]));
                                return keyCommands;});
                            return {
                                focus: function() {
                                    KeyboardCommands.setAll(keyCommands);
                                    return this;},
                                unfocus: function() {
                                    KeyboardCommands.removeAll(Object.keys(keyCommands));
                                    return this;}};}))}
                return {
                    forShape: (shape) => buildStep(ShapeChart.Builder.forShape(shape).unfixed()),
                    blank: () => buildStep(ShapeChart.Builder.blank().unfixed())}; })};});
    const ShapeCreator = {
        new: () => {
            const shapeInput = ShapeInput.Builder.blank().focus();
            const ShapeCreatorStyle = {
                buttonMarginTop: 10,
                buttonWidth: ShapeInput.Style.width / (2 + 3 / Numbers.goldenRatio)};
            ShapeCreatorStyle.buttonY = ShapeInput.Style.height + ShapeCreatorStyle.buttonMarginTop;
            ShapeCreatorStyle.buttonHeight = ShapeCreatorStyle.buttonWidth / Numbers.goldenRatio;
            ShapeCreatorStyle.buttonSpacing = ShapeCreatorStyle.buttonWidth / Numbers.goldenRatio;
            return SVG.Builder.G()
                .withClass("shape-creator")
                .withChild(shapeInput)
                .withChild(SVG.Builder.TextButton
                    .withDimensions(
                        ShapeCreatorStyle.buttonHeight,
                        ShapeCreatorStyle.buttonY,
                        ShapeCreatorStyle.buttonWidth,
                        ShapeCreatorStyle.buttonHeight)
                    .withText("Reset")
                    .withClickHandler(() => {
                        shapeInput.shape = Shapes.Schema.toString(
                            Shapes.Schema.allUnsounded);
                        shapeInput.rootFretRange = [Frets.roots.first, Frets.roots.last];})
                    .withClass("shape-creator-reset-button"))
                .withChild(SVG.Builder.TextButton
                    .withDimensions(
                        2 * ShapeCreatorStyle.buttonHeight + ShapeCreatorStyle.buttonWidth,
                        ShapeCreatorStyle.buttonY,
                        ShapeCreatorStyle.buttonWidth,
                        ShapeCreatorStyle.buttonHeight)
                    .withText("Save")
                    .withClickHandler(() => {}));
    }};
    return {
        create: () => SVG.Builder.SVG
            .withWidth(400)
            .withHeight(400)
            .withClass("chord-jog-app")
            .withAttributes({
                fill: "none",
                stroke: Style.colors.heavy,
                strokeWidth: Style.stroke.width,
                strokeLinecap: "round"})
            // .withChild(FingerSelect.Builder.build())
            .withChild(ShapeCreator.new())
            .withChild()};})();