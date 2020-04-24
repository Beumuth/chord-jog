const ChordJogApp = ( () =>  {
    const Style = {
        stroke: { width: 1 } };
    const Geometry = {
        distance2: (a, b) =>
            Math.pow(a[0] - b[0], 2) +
            Math.pow(a[1] - b[1], 2),
        projectPointOnLineSegment:  (segment, p) => {
            const 	px = p[0] - segment[0][0],
                py = p[1] - segment[0][1],
                ux = segment[1][0] - segment[0][0],
                uy = segment[1][1] - segment[0][1],
                k = _.clamp((px*ux + py*uy) / (ux*ux + uy*uy), 0, 1)
            //proj(p, u) = k*u
            return [segment[0][0] + k * ux, segment[0][1] + k * uy];
        }
    };
    Style.stroke.halfWidth = Style.stroke.width * .5;
    const SVG = {
        Builder: (() => {
            const dashifyAttributeName = (name) => _.range(0, name.length)
                .map(charIndex => ((curChar) =>
                    curChar === curChar.toLowerCase() ?
                        curChar :
                        "-" + curChar.toLowerCase())
                (name.charAt(charIndex)));
            return {
                element: (tagName) => {
                    const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
                    const furtherOptions = {
                        withAttribute: (name, value) => {
                            element.setAttribute(dashifyAttributeName(name), value)
                            return furtherOptions; },
                        withAttributes: (attributes) => {
                            Object.keys(attributes).forEach(name =>
                                element.setAttribute(dashifyAttributeName(name), attributes[name]));
                            return furtherOptions; },
                        withDataAttribute: (name, value) => {
                            element.dataset[name] = value;
                            return furtherOptions; },
                        withDataAttributes: (dataAttributes) => {
                            Object.keys(dataAttributes).forEach(dataAttribute =>
                                element.dataset[dataAttribute] = dataAttributes[dataAttribute]);
                            return furtherOptions; },
                        withGetter: (key, getter) => {
                            Object.defineProperty(element, key, {get: getter});
                            return furtherOptions;
                        },
                        withSetter: (key, setter) => {
                            Object.defineProperty(element, key, {set: setter});
                            return furtherOptions;
                        },
                        withProperty: (key, property) => {
                            Object.defineProperty(element, key, property);
                            return furtherOptions;
                        },
                        withProperties: (properties) => {
                            Object.defineProperties(element, properties);
                            return furtherOptions;
                        },
                        withClass: (className) => {
                            element.classList.add(className);
                            return furtherOptions;
                        },
                        withClasses: (...classes) => {
                            element.classList.add(classes);
                            return furtherOptions;
                        },
                        withChild: (element) => {
                            element.append(element);
                            return furtherOptions; },
                        withChildren: (...elements) => {
                            element.append(elements);
                            return furtherOptions; },
                        withEventListener: (eventType, handler) => {
                            element.addEventListener(
                                eventType.toLowerCase(),
                                handler.bind(element));
                            return furtherOptions; },
                        withEventListeners: (eventListeners) => {
                            Object.keys(eventListeners).forEach(eventType =>
                                element.addEventListener(
                                    eventType.toLowerCase(),
                                    eventListeners[eventType].bind(element)));
                            return furtherOptions; },
                        withMutation: (mutation) => {
                            mutation(element);
                            return furtherOptions; },
                        withMutationObserver: (mutationObserver, configuration={}) => {
                            mutationObserver.observe(element, configuration);
                            return furtherOptions; },
                        disableTextSelection: () => {
                            [
                                "webkitUserSelect",
                                "mozUserSelect",
                                "msUserSelect",
                                "userSelect"]
                            .forEach(selectAttribute => {
                                if(_.has(element.style, selectAttribute)) {
                                    element.style[selectAttribute] = "none"; } });
                            return furtherOptions; },
                        build: () => element };
                    return furtherOptions; },
                G: SVG.Builder.element("g"),
                Circle: ({
                    withCenter: (c) => ({
                        withRadius: (radius) => SVG.Builder
                            .element("circle")
                            .withAttributes({
                                cx: c[0],
                                cy: c[1],
                                r: radius }) }) }),
                Line: ({
                    withEndpoints: (p1, p2) => SVG.Builder
                        .element("line")
                        .withAttributes({
                            x1: p1[0],
                            y1: p1[1],
                            x2: p2[0],
                            y2: p2[1] }) }),
                Path: ({
                    withD: (d) => SVG.Builder
                        .element("path")
                        .withAttributes({d: d}) }),
                SVG: ({
                    withWidth: (width) => ({
                        withHeight: (height) => SVG.Builder
                            .element("svg")
                            .withAttributes({
                                viewBox: `0 0 ${width} ${height}`,
                                xmlns: "xmlns='http://www.w3.org/2000/svg'",
                                width: width,
                                height: height }) }) }),
                Text: ({
                    withTextContent: (textContent) => SVG.Builder
                        .element("text")
                        .withMutation((element) => element.textContent = textContent) }) }; })() }
    const Strings = {
        count: 6  };
    const Fingers = {
        any: "*",
        none: "x",
        thumb: 'T',
        index: "1",
        middle: "2",
        ring: "3",
        pinky: "4" };
    const Frets = {
        dead: "x",
        open: "o",
        first: 1,
        last: 15,
        maxRoot: 11,
        Relative: {
            any: "*",
            root: 0,
            max: 4 },
        Range: {
            create: (min, max) => ({
                min: min,
                max: max
            }) } };
    Frets.fingerless = [Frets.dead, Frets.open];
    Frets.fingerful = _.range(Frets.first, Frets.last);
    Frets.roots = Frets.fingerful.slice(0, Frets.maxRoot)
    Frets.all = Frets.fingerless.concat(Frets.fingerful);
    Frets.isFingerless = Frets.fingerless.includes;
    Frets.isFingerful = Frets.fingerful.includes;
    Frets.Relative.all = _.range(Frets.Relative.root, Frets.Relative.max);
    Frets.Relative.count = Frets.Relative.all.length;

    const StringActions = {
        create: {
            stringFretFinger: (string, fret, finger) => ({
                string: string,
                fret: fret,
                finger: finger }),
            dead: (string) => StringActions.stringFretFinger(string, Frets.dead, Fingers.none),
            open: (string) => StringActions.stringFretFinger(string, Frets.open, Fingers.none) } };

    const Shapes = {
        Schemas: {
            fromExpression: (expression) =>
                expression.split(";").map((stringActionExpression, stringIndex) =>
                    stringActionExpression === Frets.dead ? StringActions.create.dead(stringIndex) :
                        stringActionExpression === Frets.open ? StringActions.create.open(stringIndex) :
                            StringActions.create.stringFretFinger(
                                stringIndex,
                                Number.parseInt(stringActionExpression.charAt(0)),
                                Number.parseInt(stringActionExpression.charAt(2)) ) ),
            toExpression: (schema) =>
                schema.map(stringAction =>
                    Frets.isFingerless(stringAction.fret) ? stringAction.fret :
                        stringAction.fret + "," + stringAction.finger)
                    .join(";") },
        create: (schema, range) => ({
            schema: schema,
            range: range }),
        fromExpressionLines: (expression) => expression.length === 0 ? [] :
            expression.split(/\r?\n/).map((line, lineNumber) => {
                const lineProperties = line.split(";");
                return Shapes.create(
                    Shapes.Schemas.fromExpression(lineProperties[0]),
                    Frets.Range.create(
                        Number.parseInt(lineProperties[1].charAt(0)),
                        Number.parseInt(lineProperties[1].charAt(1)) ) ); }),
        toExpressionLines: (shapes) => shapes.length === 0 ? "" :
            shapes
                .map(shape =>
                    Shapes.Schemas.toExpression(shape.schema) + ";" +
                    shape.range.min + "," + shape.range.max)
                .join("\r\n"),
        localStorageKey: "chord-jog-shapes",
        loadFromLocalStorage: () => {
            const shapeString = localStorage.getItem(Shapes.localStorageKey);
            Shapes.all = shapeString === null || shapeString.length === 0 ?
                [] : Shapes.all = Shapes.fromExpressionLines(shapeString); },
        saveToLocalStorage: () => localStorage.setItem(
            Shapes.localStorageKey,
            Shapes.toExpressionLines(Shapes.all)) };
    Shapes.loadFromLocalStorage(); //Initialize by loading shapes from local storage

    const FingerSelect = (() => {
        const Regions = {
            States: {
                all: [
                    "unselected",
                    "preview",
                    "selected",
                    "unselectable"],
                isValid: (state) => Regions.States.all.includes(state)
            },
            FingerLabel: {
                Text: {
                    createForRegion: (region) => SVG.Builder.Text
                        .withTextContent(region.text)
                        .withAttributes({
                            x: region.position[0],
                            y: region.position[1],
                            fill: "black",
                            fontFamily: "Courier New",
                            fontSize: 37,
                            dx: -10.5 + region.offset[0],
                            dy: 10.5 + region.offset[1]
                        }).build()
                },
                Outline: {
                    createForRegion: (region) => SVG.Builder.Circle
                        .withCenter(region.position)
                        .withRadius(16)
                        .withClass("finger-label-outline")
                        .build()
                },
                createForRegion: (region) => SVG.Builder.G
                    .withClass("fingerLabel")
                    .withDataAttribute("for", region.attribute)
                    .withChildren(
                        Regions.FingerLabel.Text.createForRegion(region),
                        Regions.FingerLabel.Outline.createForRegion(region))
                    .build()
            },
            Builder: {
                withFinger: (finger) => ({
                    withAttribute: (attribute) => ({
                        withText: (text) => ({
                            withPosition: (p) => ({
                                withOffset: (d) => {
                                    const buildStep = (distance2Mapper) => ({
                                        build: () => ({
                                            finger: finger,
                                            attribute: attribute,
                                            text: text,
                                            position: p,
                                            offset: d,
                                            distance2Mapper: distance2Mapper
                                        })
                                    });
                                    return {
                                        withPointModel: (p) => buildStep(
                                            (x) => Geometry.distance2(x, p)),
                                        withLineSegmentModel: (lineSegment) => buildStep(
                                            (x) => Geometry.distance2(x,
                                                Geometry.projectPointOnLineSegment(lineSegment, x)))
                                    };
                                }
                            })
                        })
                    })
                })
            },
            withRegionAttribute: (regionAttribute) => Regions.all.find(region => region.attribute === regionAttribute),
            withFinger: (finger) => Regions.all.find(region => region.finger === finger),
            closestToPoint: (p) => Regions.all.reduce((a, b) =>
                a.distance2Mapper(p) < b.distance2Mapper(p) ? a : b) };
        Regions.all = [
            Regions.Builder
                .withFinger(Fingers.any)
                .withAttribute("palm")
                .withText(Fingers.any)
                .withPosition(149, 250)
                .withOffset(-.25, 3.5)
                .withPointModel([149, 241])
                .build(),
            Regions.Builder
                .withFinger(Fingers.thumb)
                .withAttribute("thumb")
                .withText(Fingers.thumb)
                .withPosition(37.8, 188)
                .withOffset(-.5, -.5)
                .withLineSegmentModel([[11, 137],[47, 211]])
                .build(),
            Regions.Builder
                .withFinger(Fingers.index)
                .withAttribute("index")
                .withText(Fingers.index)
                .withPosition(91, 110)
                .withOffset(.5, -.5)
                .withLineSegmentModel([[82, 25], [94, 141]])
                .build(),
            Regions.Builder
                .withFinger(Fingers.middle)
                .withAttribute("middle")
                .withText(Fingers.middle)
                .withPosition(135.75, 94)
                .withOffset(0, -.5)
                .withLineSegmentModel([[131, 7], [139, 133]])
                .build(),
            Regions.Builder
                .withFinger(Fingers.ring)
                .withAttribute("ring")
                .withText(Fingers.ring)
                .withPosition(177.5, 104)
                .withOffset(-1, 0)
                .withLineSegmentModel([[179, 29], [175, 141]])
                .build(),
            Regions.Builder
                .withFinger(Fingers.pinky)
                .withAttribute("pinky")
                .withText(Fingers.pinky)
                .withPosition(217.3, 130)
                .withOffset(-1.75, -1)
                .withLineSegmentModel([[219, 61], [219, 158]])
                .build() ];
        const keysValuesToObject = (keys, values) => {
            const object = {};
            _.range(0, keys.length).forEach(index => object[keys[index]] = values[index]);
            return object;
        };
        return {
            create: () => {
                //Create <g> element
                const fingerSelect = SVG.Builder.G
                    .withAttributes({
                        cursor: "pointer",
                        pointerEvents: "fill",
                        width: 233,
                        height: 291 })
                    .withClass("finger-select")
                    .withDataAttributes(
                        keysValuesToObject(
                            Regions.all.map(region => region.attribute),
                            _.times(Regions.all.length, "unselected") ) )
                    .withChild(SVG.Builder.Path //Hand outline
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
                        .withAttribute("class", "outline")
                        .build())
                    .withChildren(Regions.all.map(Regions.FingerLabel.createForRegion)) //Finger labels
                    .withEventListeners({
                        mouseMove: (e) => {
                            //Get the preview region based on closest point to mouse
                            const previewFinger = Regions.closestToPoint([e.offsetX, e.offsetY]).finger;

                            //Set the cursor to 'auto' if the preview region is 'unselectable',
                            //otherwise 'pointer'.
                            fingerSelect.setAttribute(
                                "cursor",
                                "unselectable" ===
                                fingerSelect.getFingerState(previewFinger) ?
                                    "auto" : "pointer");
                            //Set the preview
                            fingerSelect.preview = previewFinger;
                        },
                        mouseDown: (e) =>
                            this.selected =	Regions.closestToPoint([e.offsetX, e.offsetY]).finger,
                        mouseLeave: this.unpreview,
                        fingerStateChanged: (e) => {
                            //Is the new state valid?
                            if (! Regions.States.isValid(e.new)) {
                                //No - reset to the old value and return
                                return this.dataset[e.attribute] = e.old;
                            }

                            //Valid. Is this an exclusive state?
                            if (["preview", "selected"].includes(e.new)) {
                                //Yes. If there's another region with the exclusive state, switch it to 'unselected'.
                                Regions.all
                                    .map(region => ({
                                        attribute: region.attribute,
                                        state: this.dataset[region]
                                    }))
                                    .filter(regionState =>
                                        e.attribute !== regionState.attribute &&
                                        regionState.state === e.new)
                                    .forEach(regionState =>
                                        this.dataset[regionState.attribute] = "unselected");
                            }
                            //Style the region according to the new state.
                            const fingerLabel = this.querySelector(
                                `.fingerLabel[data-for='${e.attribute}']`);
                            const fingerLabelOutline = fingerLabel.querySelector("circle");
                            //Hide the label if 'unselectable'
                            fingerLabel.setAttribute("display",
                                "unselectable" === e.new ? "none" : "inline");
                            //Show the stroke if 'preview' or 'selected'
                            fingerLabelOutline.setAttribute("stroke",
                                ["preview", "selected"].includes(e.new) ? "black" : "none");
                            //Dash the stroke if 'preview'
                            fingerLabelOutline.setAttribute("stroke-dasharray",
                                "preview" === e.new ? "4 5" : null);
                        }
                    })
                    .withMutationObserver(
                        new MutationObserver((mutations) =>
                            mutations.map(mutation => {
                                let attribute = mutation
                                    .attributeName
                                    .substring("data-".length);
                                return {
                                    attribute: attribute,
                                    old: mutation.oldValue,
                                    new: fingerSelect.dataset[attribute]}
                            }).forEach(fingerStateChangedHandler(fingerSelect))),
                        { attributeFilter: Regions.map(region => "data-" + region.attribute)})
                    .withProperties((() => {
                        //Add a getter and setter for each region state
                       let keys = Regions.map(region => region.attribute);
                       return keysValuesToObject(keys, keys.map(key => ({
                           get: () => fingerSelect.dataset[key],
                           set: (state) => fingerSelect.dataset[key] = state
                       }))); })())
                    .withProperties({
                        all: {
                            get: () => Regions.map(region => ({
                                finger: region.finger,
                                state: fingerSelect.dataset[region.attribute] }) ) },
                        selected: {
                            get: () => fingerSelect.getFingerWithExclusiveState("selected"),
                            set: (finger) => {
                                //Unselect if null or undefined
                                if(_.isNil(finger)) {
                                    return fingerSelect.unselect();
                                }

                                //Get the newly selected region state
                                const selectedFingerCurState =
                                    fingerSelect.getFingerState(finger);
                                //Is it unselectable or already selected?
                                if(["unselectable", "selected"].includes(
                                    selectedFingerCurState)) {
                                    //Yes. Do nothing.
                                    return;
                                }

                                //Get the previously selected region
                                const previouslySelectedFinger = fingerSelect.selected;
                                //Does one exist?
                                if(previouslySelectedFinger !== null) {
                                    //Yes. Unselect it.
                                    fingerSelect.setFingerState(previouslySelectedFinger,
                                        "unselected");
                                }

                                //Select the new finger
                                fingerSelect.setFingerState(finger, "selected")
                            } },
                        preview: {
                            get: () => fingerSelect.getFingerWithExclusiveState("preview"),
                            set: (finger) => {
                                //Unpreview if null or undefined
                                if(_.isNil(finger)) {
                                    return fingerSelect.unpreview();
                                }

                                //Get the current preview region (possibly undefined)
                                const existingPreviewFinger = fingerSelect.preview;
                                //Does one exist, and if so does it differ from
                                //the current preview finger?
                                if(! [null, finger].includes(existingPreviewFinger)){
                                    //Yes. Unselect it.
                                    fingerSelect.setFingerState(
                                        existingPreviewFinger, "unselected");
                                }
                                //Is the new region unselected?
                                if(fingerSelect.getFingerState(finger) === "unselected") {
                                    //Yes. Preview it.
                                    //(only unselected regions can be previewed)
                                    fingerSelect.setFingerState(finger, "preview");
                                }
                            } } })
                    .disableTextSelection()
                    .build();
                fingerSelect.unpreview = () => {
                    const previewFinger = fingerSelect.preview;
                    if(! _.isNil(previewFinger)) {
                        fingerSelect.setFingerState(previewFinger, "unselected");
                    }
                }
                fingerSelect.unselect = () => {
                    const selectedFinger = fingerSelect.selected;
                    if(! _.isNil(selectedFinger)) {
                        fingerSelect.setFingerState(selectedFinger, "unselected");
                    }
                }
                fingerSelect.getFingerState = (finger) =>
                    fingerSelect.dataset[Regions.withFinger(finger).attribute];
                fingerSelect.setFingerState = (finger, state) =>
                    fingerSelect.dataset[Regions.withFinger(finger).attribute] = state;
                fingerSelect.getFingerWithExclusiveState = (state) =>
                    _.defaultTo(
                        fingerSelect.all.find(
                            regionState => regionState.state === state),
                        {finger: null}
                    ).finger;
                return fingerSelect;
            } } })();

    const ShapeChart = {
        Builder: {
            Blank: (() => {
                //Initialize some constants
                const halfRoot2 = .5 * Math.SQRT2;
                const FingerlessIndicator = {
                    radius: 5,
                    marginBottom: 2 };
                const padding = Style.stroke.halfWidth + FingerlessIndicator.radius;
                FingerlessIndicator.startX = padding;
                FingerlessIndicator.startY = padding;
                FingerlessIndicator.diameter = 2 * FingerlessIndicator.radius;
                const Fretboard = {
                    stringSpacing: 25,
                    fretHeight: 30,
                    startX: padding,
                    startY: FingerlessIndicator.startY +
                        FingerlessIndicator.diameter +
                        FingerlessIndicator.marginBottom };
                Fretboard.width = Fretboard.stringSpacing * (Strings.count - 1);
                Fretboard.height = Fretboard.fretHeight * Frets.Relative.count;

                //shape-chart
                return SVG.Builder.G
                    .withClass("shape-chart")
                    .withChild(SVG.Builder.G
                        .withClass("fingerless-indicators")
                        .withChildren(_.range(0, Strings.count).map(stringIndex => {
                            const center = [
                                padding + (stringIndex * Fretboard.stringSpacing),
                                padding + FingerlessIndicator.radius];
                            //  string-fingerless-indicator
                            return SVG.Builder.G
                                .withClass("string-fingerless-indicator")
                                .withDataAttribute("stringIndex", stringIndex)
                                .withChild(SVG.Builder.Circle
                                    .withCenter(center[0], center[1])
                                    .withClass("open-string-indicator")
                                    .build())
                                .withChild(SVG.Builder.Path
                                    .withD(
                                        `M 
                                            ${center[0] - FingerlessIndicator.radius * halfRoot2},
                                            ${center[1] - FingerlessIndicator.radius * halfRoot2}
                                        l 
                                            ${FingerlessIndicator.diameter * halfRoot2},
                                            ${FingerlessIndicator.diameter * halfRoot2}
                                        m 0, ${-FingerlessIndicator.diameter * halfRoot2}
                                        l 
                                            ${-FingerlessIndicator.diameter * halfRoot2},
                                            ${FingerlessIndicator.diameter * halfRoot2}`)
                                    .withClass("dead-string-indicator")
                                    .build())
                                .build()
                        })))
                    .withChild(SVG.Builder.G
                        .withClass("strings")
                        .withChildren(_.range(0, String.count).map(stringIndex => {
                            const x = Fretboard.startX + stringIndex * Fretboard.stringSpacing;
                            return SVG.Builder.Line
                                .withEndpoints(
                                    [x, Fretboard.startY],
                                    [x, Fretboard.startY + Fretboard.height])
                                .withClass("string")
                                .withDataAttribute("index", stringIndex)
                                .build();
                        }))
                        .build() )
                    .withChild(SVG.Builder.G
                        .withClass("fretsSeparators")
                        .withChildren(_.range(0, Frets.Relative.count + 1).map(fretSeparatorIndex => {
                            const y = Fretboard.startY + (fretSeparatorIndex * Fretboard.fretHeight);
                            return SVG.Builder.Line
                                .withEndpoints(
                                    [Fretboard.startX, y],
                                    [Fretboard.startX + Fretboard.width, y])
                                .withClass("fretSeparator")
                                .withDataAttribute("above", fretSeparatorIndex > 0 ?
                                    fretSeparatorIndex - 1 :
                                    null)
                                .withDataAttribute("below", fretSeparatorIndex < Frets.Relative.count ?
                                    `${fretSeparatorIndex}` : null)
                                .build();
                        }))
                        .build() ) })(),
            ForShape: ((shape) => {
                const shapeChart = ShapeChart.Builder.Blank;
                //TODO
                return shapeChart })() } };
    return {
        Builder: SVG.Builder.SVG
            .withWidth(250)
            .withHeight(300)
            .withClass("chord-jog-app")
            .withAttributes({
                fill: "none",
                stroke: "black",
                strokeWidth: Style.stroke.width,
                strokeLinecap: "round"})
            .withChild(ShapeChart.Builder.Blank.build())}; })();