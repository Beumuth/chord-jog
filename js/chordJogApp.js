/*
 * TODO
 *      Move FingerSelect data-[finger.name] attributes to corresponding finger-select-region data-state attribute
 *      Fire onchange event for finger-select selections
 *      Listen to fingerSelect.onChange in shape-input, update active finger
 *      Add MouseTrap to SVGBuilder (MouseTrap.for().withPadding())
 *      Use MouseTrap for finger-select
 *      Add withAttributeChangeListener to SVG.Builder.createElement to wrap mutation observers
 */

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
    const Module = {of: (f) => f()};

    const Objects = {
        changeFieldAndReturn: (object, key, value) => {
            object[key] = value;
            return object;},
        Builder: Module.of(() => {
            const furtherOptions = {
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
                withField(field, value=undefined) {
                    this[field] = value;
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
                    return this; },
                merge: (other) => {
                    _.merge(this, other);
                    return this; } };
            return {
                fromScratch: () => furtherOptions,
                fromExisting: (existing) => {
                    _.merge(existing, furtherOptions);
                    return existing; }}; })};

    const Arrays = {
        updateItem: (array, index, modification) => {
            modification(array[index]);
            return array;}}

    const Geometry = {
        distance2: (a, b) =>
            Math.pow(a[0] - b[0], 2) +
            Math.pow(a[1] - b[1], 2),
        projectPointOnLineSegment:  (p, segment) => {
            const px = p[0] - segment[0][0],
                py = p[1] - segment[0][1],
                ux = segment[1][0] - segment[0][0],
                uy = segment[1][1] - segment[0][1],
                k = _.clamp((px*ux + py*uy) / (ux*ux + uy*uy), 0, 1)
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
    Strings.all = _.range(1, Strings.count+1);
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
    Frets.fretted = _.range(Frets.first, Frets.last);
    Frets.roots = Frets.fretted.slice(0, Frets.maxRoot);
    Frets.all = [Frets.open].concat(Frets.fretted);
    Frets.isFretted = Frets.fretted.includes;
    Frets.isOpen = (fret) => ! Frets.isFretted(fret);
    Frets.Relative.all = _.range(
        Frets.Relative.root,
        Frets.Relative.max+1);
    Frets.Relative.count = Frets.Relative.all.length;
    Frets.Relative.first = Frets.Relative.all[0];
    Frets.Relative.last = Frets.Relative.all[Frets.Relative.count - 1];
    Frets.Range.full = Frets.Range.create(Frets.first, Frets.last);

    const StringActions = {
        unsounded: "",
        open: "o",
        dead: "x",
        fingered: (fret, finger) => ({
            sounded: true,
            fret: fret,
            finger: finger })};
    StringActions.deadened = (fret, finger) => ({
        sounded: false,
        fret: fret,
        finger: finger });
    StringActions.fromString = (string) =>
        string === StringActions.unsounded ?
            StringActions.unsounded :
            string === StringActions.open ?
                StringActions.open :
                string.charAt(0) === StringActions.dead ?
                    StringActions.deadened(
                        Number.parseInt(string.charAt(1)),
                        string.charAt(2)) :
                    StringActions.fingered(
                        Number.parseInt(string.charAt(0)),
                        string.charAt(1));
    StringActions.toString = (stringAction) =>
        stringAction === StringActions.unsounded ?
            StringActions.unsounded :
            stringAction === StringActions.open ?
                StringActions.open : stringAction.sounded ?
                    `${stringAction.fret}${stringAction.finger}` :
                        `x${stringAction.fret}${stringAction.finger}`;
    StringActions.isFingerless = (stringAction) => [StringActions.unsounded, StringActions.open].includes(stringAction);
    StringActions.isFingered = (stringAction) => ! StringActions.isFingerless(stringAction);
    StringActions.isDeadened = (stringAction) =>
        StringActions.isFingered(stringAction) && ! stringAction.sounded;
    StringActions.equals = (a, b) => StringActions.toString(a) === StringActions.toString(b);

    const SVGBuilder = Module.of(() => {
        const dashifyAttributeName = (name) =>
            _.range(0, name.length)
                .map(charIndex => ((curChar) =>
                    curChar === curChar.toLowerCase() ?
                        curChar : "-" + curChar.toLowerCase())(
                    name.charAt(charIndex)))
                .join("");
        const createElement = function(tagName) {
            return Objects.Builder
                .fromExisting(
                    document.createElementNS("http://www.w3.org/2000/svg", tagName))
                .withMethods({
                    withAttribute: function(name, value) {
                        this.setAttribute(dashifyAttributeName(name), value)
                        return this; },
                    withAttributes: function(attributes) {
                        Object.keys(attributes).forEach(name =>
                            this.setAttribute(dashifyAttributeName(name), attributes[name]));
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
                        this.addEventListener(
                            eventType.toLowerCase(),
                            handler.bind(this));
                        return this; },
                    withEventListeners: function(eventListeners) {
                        Object.keys(eventListeners).forEach(eventType =>
                            this.addEventListener(
                                eventType.toLowerCase(),
                                eventListeners[eventType].bind(this)));
                        return this; },
                    withMutationObserver: function(mutationObserver, configuration={}) {
                        mutationObserver.observe(this, configuration);
                        return this; },
                    withModification: function(modification) {
                        modification.bind(this)();
                        return this;},
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
                            return this;}};}));};
        return {
            element: createElement,
            g: () => createElement("g"),
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
            Line: ({
                withEndpoints: (p1, p2) =>
                    createElement("line")
                        .withAttributes({
                            x1: p1[0],
                            y1: p1[1],
                            x2: p2[0],
                            y2: p2[1] }) }),
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
            Text: ({
                withTextContent: (textContent) => createElement("text")
                    .withMutation((element) =>
                        element.textContent = textContent)
                    .withMethods({
                        withTextLength: function(value) { this.setAttribute("textLength", value); return this; },
                        withLengthAdjustSpacing: function() {
                            this.setAttribute("lengthAdjust", "spacing");
                            return this; },
                        withLengthAdjustSpacingAndGlyphs: function() {
                            this.setAttribute("lengthAdjust", "spacingAndGlyphs");
                            return this; }})
                    .withAttributes({
                        fill: Style.textColor,
                        fontFamily: Style.font,})}) }; });
    SVGBuilder.Rect.copy = (svgRect) => SVGBuilder.Rect
        .withX(svgRect.x)
        .withY(svgRect.y)
        .withWidth(svgRect.width)
        .withHeight(svgRect.height);

    //A Schema is an array of 6 StringActions
    const Shape = {
        fromString: (string) => string.split(";").map(StringActions.fromString),
        toString: (shape) => shape.map(StringActions.toString).join(";")};
    Shape.allUnsounded = Shape.fromString(";;;;;");
    Shape.equals = (a, b) => Shape.toString(a) === Shape.toString(b);

    const ShapeFilter = {
        create: (shape, range) => ({
            shape: shape,
            range: range }),
        fromString: (string) => string.length === 0 ? [] :
            string.split(/\r?\n/).map((line) => {
                const lineProperties = line.split(";");
                return ShapeFilter.create(
                    Shape.fromString(lineProperties[0]),
                    Frets.Range.create(
                        Number.parseInt(lineProperties[1].charAt(0)),
                        Number.parseInt(lineProperties[1].charAt(1)) ) ); }),
        toString: (shapeFilters) => shapeFilters.length === 0 ? "" :
            shapeFilters
                .map(shapeFilter =>
                    Shape.toString(shapeFilter.shape) + ";" +
                    shapeFilter.range.min + "," + shapeFilter.range.max)
                .join("\r\n"),
            localStorageKey: "chord-jog-shapes",
        loadFromLocalStorage: () => {
                const shapeFilterString = localStorage.getItem(ShapeFilter.localStorageKey);
                ShapeFilter.all = shapeFilterString === null || shapeFilterString.length === 0 ?
                    [] : ShapeFilter.all = ShapeFilter.fromString(shapeFilterString); },
        saveToLocalStorage: () => localStorage.setItem(
            ShapeFilter.localStorageKey,
            ShapeFilter.toString(ShapeFilter.all)) };
    const FingerSelect = Module.of(() => {
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
                    createForRegion: (region) => SVGBuilder.Text
                        .withTextContent(region.finger.label)
                        .withAttributes({
                            x: region.position[0],
                            y: region.position[1],
                            fontFamily: "Courier New",
                            fontSize: 37,
                            dx: -10.5 + region.offset[0],
                            dy: 10.5 + region.offset[1]
                        }) },
                Outline: {
                    createForRegion: (region) => SVGBuilder.Circle
                        .withCenter(region.position)
                        .withRadius(18)
                        .withClass("finger-label-outline") },
                createForRegion: (region) => SVGBuilder
                    .g()
                    .withClass("finger-label")
                    .withDataAttribute("for", region.finger.name)
                    .withChildren([
                        Regions.FingerLabel.Text.createForRegion(region),
                        Regions.FingerLabel.Outline.createForRegion(region)]) },
            Joint: {
                createForRegion: Module.of(() => {
                    const pointToJoint = (p) => SVGBuilder.Circle
                        .withCenter(p)
                        .withRadius(1)
                        .withClass("finger-select-region-joint")
                        .withAttribute("strokeWidth", 0);
                    return (region) => region.hitbox.length === 1 ?
                        [pointToJoint(region.hitbox[0])] :
                        region.hitbox.map((region, index) =>
                            pointToJoint(region).withDataAttribute("index", index));})},
            Builder: {
                withFinger: (finger) => ({
                    withPosition: (p) => ({
                        withOffset: (d) => {
                            const region = {
                                finger: finger,
                                position: p,
                                offset: d};
                            return {
                                withPointModel: (p) => {
                                    region.hitbox = [p];
                                    return region;},
                                withLineSegmentModel: (lineSegment) => {
                                    region.hitbox = lineSegment;
                                    return region; } }; }}) }) },
            withFinger: (finger) => Regions.all.find(region => region.finger === finger)};
        Regions.all = [
            Regions.Builder
                .withFinger(Fingers.thumb)
                .withPosition([37.8, 188])
                .withOffset([-.5, -.5])
                .withLineSegmentModel([[11, 137],[48, 209]]),
            Regions.Builder
                .withFinger(Fingers.index)
                .withPosition([91, 110])
                .withOffset([.5, -.5])
                .withLineSegmentModel([[82, 25], [94, 141]]),
            Regions.Builder
                .withFinger(Fingers.middle)
                .withPosition([135.75, 94])
                .withOffset([0, -.5])
                .withLineSegmentModel([[131, 7], [139, 133]]),
            Regions.Builder
                .withFinger(Fingers.ring)
                .withPosition([177.5, 104])
                .withOffset([-1, 0])
                .withLineSegmentModel([[181, 29], [175, 141]]),
            Regions.Builder
                .withFinger(Fingers.pinky)
                .withPosition([217.3, 130])
                .withOffset([-1.75, -1])
                .withLineSegmentModel([[219, 63], [217, 158]])];
        const keysValuesToObject = (keys, values) => {
            const object = {};
            _.range(0, keys.length).forEach(index => object[keys[index]] = values[index]);
            return object; };
        const handOutline = SVGBuilder.Path
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
            .withAttribute("class", "outline");
        const regionInfo = Regions.all.map((region) => {
            const joints = Regions.Joint.createForRegion(region);
            return {
                finger: region.finger,
                distance2Mapper: Module.of(() => {
                    const jointToPoint = (joint) => {
                        const boundingClientRect = joint.getBoundingClientRect();
                        return [boundingClientRect.x, boundingClientRect.y]; };
                    return joints.length === 1 ?
                        (p) => Geometry.distance2(p, jointToPoint(joints[0])):
                        (p) => Geometry.distance2(p,
                            Geometry.projectPointOnLineSegment(p,
                                joints.map(jointToPoint)))}),
                element: SVGBuilder.g()
                    .withClass("finger-select-region")
                    .withDataAttribute("finger", region.finger.label)
                    .withChild(Regions.FingerLabel.createForRegion(region))
                    .withChildren(joints)};});
        const mouseEventToClosestFinger = (e) => {
            const handOutlineClientRect = handOutline.getBoundingClientRect();
            return regionInfo
                .map(region => ({
                    finger: region.finger,
                    distance2: region.distance2Mapper([e.clientX, e.clientY])}))
                .reduce((closestRegion, currentRegion) =>
                    closestRegion.distance2 <= currentRegion.distance2 ?
                        closestRegion : currentRegion)
                .finger;};
        return {
            builder: () => SVGBuilder
                .g()
                .withAttributes({
                    cursor: "pointer",
                    pointerEvents: "fill",
                    width: 233,
                    height: 291 })
                .withClass("finger-select")
                .withChild(handOutline)
                .withChildren(regionInfo.map(region => region.element))
                .withMethods({
                    withFinger: function(finger) {
                        this.selected = finger;
                        return this;},
                    unpreview: function() {
                        const previewFinger = this.preview;
                        if(! _.isNil(previewFinger)) {
                            this.setFingerState(previewFinger, "unselected"); } },
                    unselect: function() {
                        const selectedFinger = this.selected;
                        if(! _.isNil(selectedFinger)) {
                            this.setFingerState(selectedFinger, "unselected"); } },
                    getFingerState: function(finger) { return this.dataset[finger.name]; },
                    setFingerState: function(finger, state) { this.dataset[finger.name] = state },
                    getFingerWithExclusiveState: function(state) {
                        return _.defaultTo(
                            this.all.find(regionState => regionState.state === state),
                            {finger: null} )
                            .finger } })
                .withEventListeners({
                    mouseMove: function(e) {
                        const previewFinger = mouseEventToClosestFinger(e);

                        //Set the cursor to 'auto' if the preview region is 'unselectable',
                        //otherwise 'pointer'.
                        this.setAttribute("cursor",
                            "unselectable" === this.getFingerState(previewFinger) ?
                                "auto" : "pointer");
                        //Set the preview
                        this.preview = previewFinger; },
                    mouseDown: function(e) { this.selected = mouseEventToClosestFinger(e); },
                    mouseLeave: function() { this.unpreview(); } })
                .withMutationObserver(
                    new MutationObserver((mutations) => mutations
                        .map(mutation => {
                            let attribute = mutation
                                .attributeName
                                .substring("data-".length);
                            return {
                                fingerSelect: mutation.target,
                                attribute: attribute,
                                old: mutation.oldValue,
                                new: mutation.target.dataset[attribute]} })
                        .forEach((e) => {
                            //Is the new state valid?
                            if (! Regions.States.isValid(e.new)) {
                                //No - reset to the old value and return
                                return e.fingerSelect.dataset[e.attribute] = e.old; }
                            //Valid. Is this an exclusive state?
                            if (["preview", "selected"].includes(e.new)) {
                                //Yes. If there's another region with the exclusive state, switch it to 'unselected'.
                                Regions.all
                                    .map(region => ({
                                        attribute: region.finger.name,
                                        state: e.fingerSelect.dataset[region] }))
                                    .filter(regionState =>
                                        e.attribute !== regionState.attribute &&
                                        regionState.state === e.new)
                                    .forEach(regionState =>
                                        e.fingerSelect.dataset[regionState.attribute] = "unselected"); }
                            //Style the region according to the new state.
                            const fingerLabel = e.fingerSelect.querySelector(
                                `.finger-label[data-for='${e.attribute}']`);
                            const fingerLabelOutline = fingerLabel.querySelector("circle");
                            //Hide the label if 'unselectable'
                            fingerLabel.setAttribute("display",
                                "unselectable" === e.new ? "none" : "inline");
                            //Show the stroke if 'preview' or 'selected'
                            fingerLabelOutline.setAttribute("stroke",
                                ["preview", "selected"].includes(e.new) ? "black" : "none");
                            //Dash the stroke if 'preview'
                            fingerLabelOutline.setAttribute("stroke-dasharray",
                                "preview" === e.new ? "4 5" : null); } )),
                    {attributeFilter: Regions.all.map(region => "data-" + region.finger.name)})
                .withDataAttributes(
                    keysValuesToObject(
                        Regions.all.map(region => region.finger.name),
                        _.times(Regions.all.length, () => "unselected") ) )
                .withProperties(Module.of(() => {
                    //Add a getter and setter for each region state
                    const keys = Regions.all.map(region => region.finger.name);
                    return keysValuesToObject(keys, keys.map(key => ({
                        get: function() { return this.dataset[key]; },
                        set: function(state) {this.dataset[key] = state; }}))); }))
                .withProperties({
                    all: {
                        get() { return Regions.all.map(region => ({
                            finger: region.finger,
                            state: this.dataset[region.finger.name] })); } },
                    selected: {
                        get() { return this.getFingerWithExclusiveState("selected"); },
                        set(finger) {
                            //Unselect if null or undefined
                            if(_.isNil(finger)) {
                                return this.unselect(); }

                            //Get the newly selected region state
                            const selectedFingerCurState =
                                this.getFingerState(finger);
                            //Is it unselectable or already selected?
                            if(["unselectable", "selected"].includes(
                                selectedFingerCurState)) {
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
                        get() {return this.getFingerWithExclusiveState("preview");},
                        set(finger) {
                            //Unpreview if null or undefined
                            if(_.isNil(finger)) {
                                return this.unpreview(); }

                            //Get the current preview region (possibly undefined)
                            const existingPreviewFinger = this.preview;
                            //Does one exist, and if so does it differ from
                            //the current preview finger?
                            if(! [null, finger].includes(existingPreviewFinger)){
                                //Yes. Unselect it.
                                this.setFingerState(
                                    existingPreviewFinger, "unselected"); }
                            //Is the new region unselected?
                            if(this.getFingerState(finger) === "unselected") {
                                //Yes. Preview it.
                                //(only unselected regionInfo can be previewed)
                                this.setFingerState(finger, "preview"); } } } })
                .disableTextSelection()} });

    const ShapeChart = Module.of(() => {
        const halfRoot2 = .5 * Math.SQRT2;
        const FingerlessIndicator = {
            Style: {
                radius: 5,
                margin: 2 }};
        FingerlessIndicator.Style.diameter = 2 * FingerlessIndicator.Style.radius;
        FingerlessIndicator.Builder = Module.of(() => {
            const DeadStringBuilder = {
                withCenter: (center) => SVGBuilder.Path
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
                withCenter: (center) => SVGBuilder.Circle
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
                                    dead: () => SVGBuilder.g()
                                        .withClass("dead-string-indicators")
                                        .withChild(DeadStringBuilder.withCenter(centerTop))
                                        .withChild(DeadStringBuilder.withCenter(centerBottom)),
                                    open: () => SVGBuilder.g()
                                        .withClass("open-string-indicators")
                                        .withChild(OpenStringBuilder.withCenter(centerTop))
                                        .withChild(OpenStringBuilder.withCenter(centerBottom))};}})};}};});
        const ShapeChartStyle = {
            padding: {
                x: 30,
                y: Style.stroke.halfWidth + FingerlessIndicator.Style.radius } };
        const FingerActions = {
            Builder: {
                withFinger: (finger) => ({
                    atFret: (fret) => ({
                        fromString: (fromString) => ({
                            toString: (toString) => ({
                                finger: finger,
                                fret: fret,
                                range: Strings.range(fromString, toString)})})})})},
            sameFingerAndFret: (a, b) => a.finger === b.finger && a.fret === b.fret};
        FingerlessIndicator.Style.startX = ShapeChartStyle.padding.x;
        FingerlessIndicator.Style.startY = ShapeChartStyle.padding.y;
        const FingerIndicator = {
            Style: { radius: 11 } };
        FingerIndicator.Style.diameter = 2 * FingerIndicator.Style.radius;
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
                toFret: (fret) => SVGBuilder.Line
                    .withEndpoints(
                        Fretboard.stringFretToXY(string, Frets.Relative.first - .5),
                        Fretboard.stringFretToXY(string, fret + .5))
                    .withClass("string-line")
                    .withDataAttribute("string", string)})};
        Fretboard.FretDividerBuilder = {
            belowFret: (belowFret = Frets.Relative.last + 1) => ({
                fromString: (fromString) => ({
                    toString: (toString) => SVGBuilder.Line
                        .withEndpoints(
                            Fretboard.stringFretToXY(fromString, belowFret - .5),
                            Fretboard.stringFretToXY(toString, belowFret - .5))
                        .withClass("fret-separator")
                        .withDataAttribute("aboveFret", belowFret - 1)
                        .withDataAttribute("belowFret", belowFret)})})};
        FingerIndicator.Builder = {
            forFingerAction: (fingerAction) => SVGBuilder
                .g()
                .withClass("finger-indicator")
                .withDataAttributes({
                    finger: fingerAction.finger,
                    fret: fingerAction.fret,
                    minString: fingerAction.range.min,
                    maxString: fingerAction.range.max})
                .withAttribute("stroke", Style.colors.superHeavy)
                .withChild(SVGBuilder.Rect
                    .withX(Fretboard.stringToXCoordinate(fingerAction.range.min) - FingerIndicator.Style.radius)
                    .withY(Fretboard.fretToYCoordinate(fingerAction.fret) - FingerIndicator.Style.radius)
                    .withWidth(FingerIndicator.Style.diameter +
                        Fretboard.Style.stringSpacing * (fingerAction.range.max - fingerAction.range.min))
                    .withHeight(FingerIndicator.Style.diameter)
                    .withRadius(FingerIndicator.Style.radius)
                    .withClass("finger-indicator-outline")
                    .withAttribute("fill", Style.colors.superHeavy))
                .withChild(SVGBuilder.Text
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
        const RootFretLabel = {
            Style: {
                fontSize: 15,
                fontFamily: "monospace" }};
        RootFretLabel.Builder = Module.of(() => {
            const forText = (text) => {
                const label = SVGBuilder.Text
                    .withTextContent(text)
                    .withClass("r-label")
                    .withAttributes({
                        x: Fretboard.stringToXCoordinate(1) - FingerIndicator.Style.radius - 2,
                        y: Fretboard.fretToYCoordinate(Frets.Relative.first),
                        dominantBaseline: "central",
                        textAnchor: "end",
                        fontFamily: "monospace",
                        fontSize: 15})
                    .withLengthAdjustSpacingAndGlyphs()
                return text.length <= 1 ? label : label
                    .withTextLength(17); };
            return {
                fixed: (fret) => forText(`${fret}`),
                unfixed: () => forText("r") }; });

        //The 'skeleton' consists of the passive portion of the ShapeFilterView -
        //fretboard and finger indicator placeholders.
        const skeletonBuilder = () => SVGBuilder
            .g()
            .withClass("shape-chart-skeleton")
            .withAttribute("stroke", Style.colors.light)
            .withChild(SVGBuilder
                .g()
                .withClass("fingerless-indicators")
                .withChildren(Strings.all
                    .map((string) => FingerlessIndicator.Builder.forString(string).topOnly)
                    .map(fingerIndicatorBuilder => [
                        fingerIndicatorBuilder.open(),
                        fingerIndicatorBuilder.dead()])
                    .flat()))
            .withChild(SVGBuilder
                .g()
                .withClass("fretboard")
                .withChildren(Strings.all.map(string => Fretboard.StringLineBuilder
                    .forString(string)
                    .toFret(Frets.Relative.last)))
                .withChildren(_.range(Frets.Relative.first, Frets.Relative.last + 2)
                    .map(belowFret => Fretboard.FretDividerBuilder
                        .belowFret(belowFret)
                        .fromString(Strings.first)
                        .toString(Strings.last))));

        //The 'meat' consists of the active portion of the ShapeFilterView -
        // darkened fretboard strings and finger indicators.
        const Meat = {
            Builder: {
                forShape: (shape) => {
                    const fingeredStringActions = shape.filter(StringActions.isFingered);
                    const maxFret = fingeredStringActions.length === 0 ? undefined : fingeredStringActions
                        .map(stringAction => stringAction.fret)
                        .reduce((a, b) => a >= b ? a : b);
                    const activeStringActions = shape
                        .map((action, index) => ({
                            string: index + 1,
                            action: action}))
                        .filter(stringAction => stringAction.action !== StringActions.unsounded);
                    const meat = SVGBuilder
                        .g()
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
                        .withChildren(_.range(Frets.Relative.first, maxFret + 2).map(belowFret =>
                            Fretboard.FretDividerBuilder
                                .belowFret(belowFret)
                                .fromString(activeStringActions[0].string)
                                .toString(activeStringActions[activeStringActions.length-1].string)
                                .withAttribute("strokeWidth", 1.5)))}
                    return activeStringActions.length === 0 ? meat : meat
                        //Open strings indicators
                        .withChildren(activeStringActions
                            .filter(stringAction => stringAction.action === StringActions.open)
                            .map(stringAction => FingerlessIndicator.Builder
                                .forString(stringAction.string)
                                .topAndBottom
                                .withMaxActiveRelativeFret(maxFret)
                                .open()
                                .withAttribute("stroke", Style.colors.black)))
                        //Dead strings indicators
                        .withChildren(activeStringActions
                            .filter(stringAction => StringActions.isDeadened(stringAction.action))
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
                            .filter(stringAction => stringAction.action !== StringActions.open)
                            //Convert to finger actions, merging ones with the same finger and fret
                            .reduce(
                                ((stringActionToFingerAction = (stringAction) => FingerActions.Builder
                                    .withFinger(stringAction.action.finger)
                                    .atFret(stringAction.action.fret)
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
        Meat.Builder.blank = () => Meat.Builder.forShape(Shape.allUnsounded);
        const containerBuilder = () => SVGBuilder
            .g()
            .withClass("shape-chart")
            .disableTextSelection()
            .withChild(skeletonBuilder())
            //data-shape
            .withGetterAndSetter("shape",
                function() { return this.dataset.shape; },
                function(shape) { this.dataset.shape = shape; })
            .withMutationObserver(new MutationObserver((mutations) => mutations
                    .map(mutation => ({
                        shapeChart: mutation.target,
                        shape: mutation.target.shape}))
                    .forEach(shapeChangeEvent => shapeChangeEvent.shapeChart
                        .querySelector(".shape-chart-meat")
                        .replaceWith(Meat.Builder
                            .forShape(Shape.fromString(shapeChangeEvent.shape))))),
                {attributeFilter: ["data-shape"]})
            //data-r
            .withGetterAndSetter("r",
                function() { return this.dataset.r; },
                function(r) {this.dataset.r = r; })
            .withMutationObserver(
                Module.of(() => {
                    const isValidR = (r) => _.range(Frets.first, Frets.maxRoot + 1)
                        .map(fret => `${fret}`)
                        .includes(r);
                    return new MutationObserver((mutations) => mutations
                        .map(mutation => ({
                            shapeChart: mutation.target,
                            oldR: mutation.oldValue,
                            r: mutation.target.r}))
                        .forEach(rChangeEvent => {
                            const rootLabel = rChangeEvent.shapeChart.querySelector(".r-label");
                            if([undefined, null, "", "null"].includes(rChangeEvent.r)) {
                                rootLabel.textContent = "r";}
                            else if(isValidR(rChangeEvent.r)) {
                                rootLabel.textContent = rChangeEvent.r;}
                            else {
                                rChangeEvent.shapeChart.dataset["r"] = rChangeEvent.oldR; }}))}),
                {
                    attributeFilter: ["data-r"],
                    attributeOldValue: true});
        return {
            Style: {
                width: Fretboard.Style.startX +
                    Fretboard.Style.width +
                    FingerIndicator.Style.radius},
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
                        .withChild(RootFretLabel.Builder.unfixed())});
                const forShape = (shape) => fixednessStep(
                    containerBuilder()
                        .withChild(Meat.Builder.forShape(shape))
                        .withDataAttribute("shape", Shape.toString(shape)));
                return {
                    blank: () => forShape(Shape.allUnsounded),
                    forShape: forShape };})};});
    const ShapeInput = Module.of(() => {
        const ShapeInput = {
            Style: {
                shapeChartMarginRight: 2},
            initialActiveFinger: Fingers.index};
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
                shapeChart.withDataAttribute("activeFinger", ShapeInput.initialActiveFinger.label);
                return {
                    withPreviewMeatContainer: (previewMeatContainer) => {
                        let dragActive = false;
                        let dragAction = null;
                        let isInside = false;
                        const mouseTrapEventListeners = {
                            withMouseEventToShapeFunction: (mouseEventToShapeFunction) => {
                                let mouseUpEventHandler = function(e) {
                                    dragActive = false;
                                    shapeChart.preview = mouseEventToShapeFunction(e).shape;
                                    if(isInside) previewMeatContainer.show(); else previewMeatContainer.hide();
                                    window.removeEventListener("mouseup", this);};
                                mouseUpEventHandler.bind(mouseUpEventHandler);
                                return {
                                    mouseenter: (e) => {
                                        if(dragActive) return;
                                        shapeChart.preview = mouseEventToShapeFunction(e).shape;
                                        previewMeatContainer.show(); },
                                    mousemove: (e) => {
                                        isInside = true;
                                        if(dragActive) {shapeChart.shape = mouseEventToShapeFunction(e).shape;}
                                        else {shapeChart.preview = mouseEventToShapeFunction(e).shape;}},
                                    mousedown: (e) => {
                                        if(e.button !== 0) return;
                                        const shapeInfo = mouseEventToShapeFunction(e);
                                        shapeChart.shape = shapeInfo.shape;
                                        dragActive = true;
                                        dragAction = shapeInfo.change;
                                        previewMeatContainer.hide();
                                        window.addEventListener("mouseup", mouseUpEventHandler)},
                                    mouseout: () => {
                                        previewMeatContainer.hide();
                                        isInside = false;}};}};
                        return {
                            Fretboard: SVGBuilder.Rect
                                .withX(ShapeChart.Fretboard.Style.x - FretboardMouseTrap.Style.padding)
                                .withY(ShapeChart.Fretboard.Style.y - FretboardMouseTrap.Style.padding)
                                .withWidth(ShapeChart.Fretboard.Style.width + 2 * FretboardMouseTrap.Style.padding)
                                .withHeight(ShapeChart.Fretboard.Style.height + 2 * FretboardMouseTrap.Style.padding)
                                .withClass("fretboard-mouse-trap")
                                .withAttributes({
                                    pointerEvents: "fill",
                                    cursor: "pointer",
                                    fill: "none",
                                    stroke: "none"})
                                .withDataAttribute("preview", shapeChart.shape)
                                .withEventListeners(mouseTrapEventListeners
                                    .withMouseEventToShapeFunction((e) => {
                                        const previewShape = Shape.fromString(shapeChart.shape).slice();
                                        const previewString = FretboardMouseTrap.xCoordinateToString(e.offsetX);
                                        const previewFret = FretboardMouseTrap.yCoordinateToFret(e.offsetY);
                                        const previewFinger = shapeChart.dataset.activeFinger;
                                        const currentAction = previewShape[previewString - 1];
                                        previewShape[previewString - 1] = dragActive ? (
                                                StringActions.isFingerless(dragAction) ?
                                                    dragAction :
                                                dragAction.sounded === true ?
                                                    StringActions.fingered(previewFret, previewFinger) :
                                                    StringActions.deadened(previewFret, previewFinger)) :
                                            StringActions.isFingerless(currentAction) ||
                                            currentAction.finger !== previewFinger ||
                                            currentAction.fret !== previewFret ?
                                                StringActions.fingered(previewFret, previewFinger) : (
                                                currentAction.sounded === true ?
                                                    StringActions.deadened(previewFret, previewFinger) :
                                                    StringActions.unsounded);
                                        return {
                                            change: previewShape[previewString - 1],
                                            shape: Shape.toString(previewShape)};})),
                            FingerlessIndicators: SVGBuilder.Rect
                                .withX(ShapeChart.FingerlessIndicator.Style.startX -
                                    ShapeChart.FingerlessIndicator.Style.radius -
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
                                .withAttributes({
                                    pointerEvents: "fill",
                                    cursor: "pointer",
                                    fill: "none",
                                    stroke: "none"})
                                .withEventListeners(mouseTrapEventListeners
                                    .withMouseEventToShapeFunction((e) => {
                                        const activeShape = Shape.fromString(shapeChart.shape);
                                        const previewShape = activeShape.slice();
                                        const previewString = FingerlessIndicatorMouseTrap.xCoordinateToString(e.offsetX);
                                        previewShape[previewString - 1] = dragActive ? (
                                            StringActions.isFingerless(dragAction) ? dragAction :
                                                previewShape[previewString -1]) : Module.of(() => {
                                            const previousStringAction = activeShape[previewString - 1];
                                            return previousStringAction === StringActions.unsounded ? StringActions.open :
                                                    StringActions.unsounded;});
                                        return {
                                            change: previewShape[previewString - 1],
                                            shape: Shape.toString(previewShape)};}))};}};}};
        return {
            Builder: Module.of(() => {
                const buildStep = (shapeChart) => {
                    const previewMeatContainer = Objects.Builder
                        .fromExisting(SVGBuilder.g()
                            .withClass("preview-meat-container")
                            .withAttributes({
                                display: "none",
                                fillOpacity: .4,
                                strokeOpacity: .5})
                            .disableTextSelection())
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
                        .withMutationObserver(
                            new MutationObserver((mutations) => mutations
                                .map(mutation => mutation.target.preview)
                                .forEach(preview => {
                                    previewMeatContainer.innerHTML = "";
                                    previewMeatContainer.withChild(ShapeChart.Meat.Builder
                                        .forShape(Shape.fromString(preview)));})),
                            {attributeFilter: ["data-preview"]});
                    const mouseTrapsBuilder = MouseTrapsBuilder
                        .withShapeChart(shapeChart)
                        .withPreviewMeatContainer(previewMeatContainer);
                    return SVGBuilder.g()
                        .withClass("shape-input")
                        .withChild(shapeChart)
                        .withChild(previewMeatContainer)
                        .withChild(mouseTrapsBuilder.Fretboard)
                        .withChild(mouseTrapsBuilder.FingerlessIndicators)
                        .withChild(FingerSelect.builder()
                            .withFinger(ShapeInput.initialActiveFinger)
                            .withAttribute("stroke-width", 2)
                            .moveTo(ShapeChart.Style.width + 2, ShapeChart.Fretboard.Style.y)
                            .scale(.5))}
                return {
                    forShape: (shape) => buildStep(ShapeChart.Builder.forShape(shape).unfixed()),
                    blank: () => buildStep(ShapeChart.Builder.blank().unfixed())}; })};});

    /*
    const ShapeFilterInput = (() => {
        const ShapeFilterInputBuilder = {
            forShapeFilter: (shapeFilter) => SVGBuilder.g()
                .withClass("shape-filter-input")
                .withChild(ShapeInput.Builder.forShape(shapeFilter.shape))};
        ShapeFilterInputBuilder.blank = () => ShapeFilterInputBuilder.forShapeFilter(
            ShapeFilter.create(Shape.allUnsounded, Frets.Range.full));
        return {
            Builder: ShapeFilterInputBuilder}; })();
     */
    return {
        create: () => SVGBuilder.SVG
            .withWidth(400)
            .withHeight(400)
            .withClass("chord-jog-app")
            .withAttributes({
                fill: "none",
                stroke: Style.colors.heavy,
                strokeWidth: Style.stroke.width,
                strokeLinecap: "round"})
            // .withChild(FingerSelect.Builder.build())
            .withChild(ShapeInput.Builder.forShape(Shape.fromString(";;11;11;23;o")))
    };})();