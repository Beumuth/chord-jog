const ChordJogApp = (() => {
    let chordJogApp=undefined;
    const Style = {
        width: 725,
        height: 875,
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
    Style.textColor = Style.colors.superHeavy;

    /**
     * A wrapper for the Module pattern
     */
    const Module = {
        of: (f, ...args) => f.apply(undefined, args)};

    const Param = Module.of((
        Validation={
            new: () => ({
                withName: name => ({
                withCondition: condition => ({
                withReason: reason => ({
                    name: name,
                    condition: condition,
                    reason: typeof reason === "string" ? () => reason : reason})})})})},
        sameAsBeforeValidation=Validation.new()
            .withName("sameAsBefore")
            .withCondition((newValue, oldValue) => newValue === oldValue)
            .withReason("The previous value is the same as the current")
    ) => ({
        Validation: Validation,
        sameAsBeforeValidation: sameAsBeforeValidation,
        new: (initialValue=undefined)=>Module.of((
            value=initialValue,
            validations=[sameAsBeforeValidation],
            observers=[],
            param={
                get: () => value,
                set: newValue => {
                    const failValidation = validations.find(validation=>validation.condition(newValue, value));
                    if(failValidation === undefined) {
                        oldValue = value;
                        value = newValue;
                        observers.forEach(observer => observer(value, oldValue));
                        return true;}
                    else {
                        return failValidation.reason(newValue, value);}},
                withValue: newValue => {
                    param.set(newValue);
                    return param;},
                addValidation: validation => validations.push(validation),
                addValidations: validations => validations.concat(validations),
                withValidation: validation => {
                    param.addValidation(validation);
                    return param;},
                withValidations: validations => {
                    param.addValidations(validations);
                    return param;},
                removeValidation: validation => Arrays.removeItem(validations, validation),
                removeValidations: validationsToRemove => validationsToRemove.forEach(validation=>
                    Arrays.removeItem(validations, validation)),
                withoutValidation: validation => {
                    param.removeValidation(validation);
                    return param;},
                withoutValidations: validations => {
                    param.removeValidations(validations);
                    return param;},
                addObserver: observer => observers.push(observer),
                addObservers: observersToAdd => observers=observers.concat(observersToAdd),
                withObserver: observer => {
                    param.addObserver(observer);
                    return param;},
                withObservers: observers => {
                    param.addObservers(observers);
                    return param;},
                removeObserver: observer => Arrays.removeItem(observers, observer),
                removeObservers: observersToRemove => observersToRemove.forEach(observer=>
                    Arrays.removeItem(observers, observer)),
                withoutObserver: observer => {
                    param.removeObserver(observer);
                    return param;},
                withoutObservers: observers => {
                    param.removeObservers(observers);
                    return param;}}
        ) => param)}));

    const Functions = {
        noop: ()=>{},
        constant: value=> ()=> value,
        /**
         * @param list
         * @param comparator Function of form (item, index)=>{...} that returns
         *      <0 if the search item is behind the item argument
         *      >0 if the search item is ahead of the item argument
         *      0 if the search item is the item argument
         * @param resolver If the item is not found, this function is called with the index of the closest guess
         *      to be mapped to a return value.
         * @returns The index of the item, or the result of calling resolver with the closest guess.
         */
        binarySearch: (list, comparator, resolver=closest=>null)=> {
            if(list.length===0) {
                return resolver(0);}
            const innerBinarySearch= (comparator, length, startIndex=0)=> {
                const guess = startIndex + Math.ceil(.5 * length) - 1;
                const comparison = comparator(list[guess], guess);
                return comparison === 0 ?
                    guess :
                    length === 1 || guess+1 === list.length || guess < 0 ?
                        resolver(clamp(guess, 0, list.length-1)) :
                        innerBinarySearch(
                            comparator,
                            Math.floor(.5 * length),
                            comparison > 0 ? guess+1 : startIndex);};
            return innerBinarySearch(comparator, list.length);},
        ifThen: (condition, then) => condition === true ? then() : undefined,
        ifThenFinal: (condition, then, final) => {
            if(condition) then();
            return final(); },
        ifThenElse: (condition, then, fElse) => condition === true ? then() : fElse(),
        ifThenElseFinal: (condition, then, fElse, final) => {
            condition === true ? then() : fElse();
            return final();},
        while: (condition, f) => {
            while(condition() === true) {
                f();}}};

    const Objects = Module.of((
        defaultBuilderizeOptions = {
            indexObject: 0,
            defaultInitial: null,
            initializer: null,
            finalStepName: "build"},
        /**
         * Converts an API that statically operates over a recurring object into a 'fluent interface'.
         * @param api An object, keys are methods names, values functions that MUST accept the
         *            recurring object consistently at a particular index.
         * @param options
         * @returns A function that accepts an object and returns the fluentized api -
         *          without the consistently-indexed parameter; with fluent-api
         *          style updates to a non-static instance of that parameter that terminates
         *          with a (by default) 'done' method, returning the instance.
         */
        builderize=(api, options=defaultBuilderizeOptions) =>
            (buildee=options.defaultInitial !== null ? options.defaultInitial :
                options.initializer !== null ? options.initializer() : {}
            ) =>  Module.of((fluentApi={})=>Objects.withFields(
            fluentApi,
            Object.fromEntries(Object
                .entries(api)
                .map(methodEntry => [
                    methodEntry[0],
                    (...args) => {
                        buildee = methodEntry[1](...Arrays.insertAt(args, options.indexObject, buildee));
                        return fluentApi;}])
                .concat([[options.finalStepName, () => buildee]])))),
        Objects = {
            withGetter: (object, key, getter) => {
                Object.defineProperty(object, key, {
                    get: getter,
                    configurable: true});
                return object;},
            withoutGetter: (object, key) => {
                Object.defineProperty(object, key, {
                    get: undefined,
                    configurable: true});
                return object;},
            withGetters: (object, getters) => {
                Object.entries(getters).forEach(getter=> Objects.withGetter(object, ...getter));
                return object;},
            withoutGetters: (object, ...keys) => {
                keys.forEach(key=> Objects.withoutGetter(object, key));
                return object;},
            withSetter: (object, key, setter) => {
                Object.defineProperty(object, key, {
                    set: setter,
                    configurable: true});
                return object; },
            withoutSetter: (object, key) => {
                Object.defineProperty(object, key, {
                    set: undefined,
                    configurable: true});
                return object;},
            withSetters: (object, setters) => {
                Object.entries(setters).forEach(setter => Objects.withSetter(object, ...setter));
                return object;},
            withoutSetters: (object, ...keys) => {
                keys.forEach(key=> Object.withoutSetter(object, key));
                return object;},
            withGetterAndSetter: (object, key, getter, setter) => {
                Object.defineProperty(object, key, {
                    get: getter,
                    set: setter,
                    configurable: true});
                return object; },
            withoutGetterAndSetter: (object, key) => {
                Object.defineProperty(object, key, {
                    get: undefined,
                    set: undefined,
                    configurable: true});
                return object;},
            withGettersAndSetters: (object, gettersAndSetters) => {
                Object.entries(gettersAndSetters).forEach(entry =>
                    Objects.withGetterAndSetter(object, entry[0], entry[1].get, entry[1].set));
                return object;},
            withoutGettersAndSetters: (object, ...keys) => {
                keys.forEach(key=> Objects.withoutGetterAndSetter(object, key));
                return object;},
            withField: (object, key, value=undefined) => {
                object[key] = value;
                return object;},
            withFields: (object, fields) => {
                Object.entries(fields).forEach(field => object[field[0]] = field[1]);
                return object;},
            withOnlyField: (object, field) => ({
                [field]: object[field]}),
            withOnlyFields: (object, ...fields) => Object.fromEntries(fields.map(field=> [field, object[field]])),
            withDefaults: (object, defaults) => {
                Object.entries(defaults).forEach(
                    defaultEntry => Objects.isNil(object[defaultEntry[0]]) ?
                        object[defaultEntry[0]] = defaultEntry[1] :
                        undefined);
                return object;},
            withParam: (object, key, param=Param.new()) => {
                return Objects.Builder(object)
                    .withField(key[0].toUpperCase() + key.substr(1), param)
                    .withGetterAndSetter(key[0].toLowerCase() + key.substr(1),
                        function() {
                            return param.get();},
                        function(value) {
                            return param.set(value);})
                    .withMethod("with" + key[0].toUpperCase() + key.substr(1), function(value) {
                        param.set(value);
                        return this;})
                    .build();},
            withParams: (object, params) => {
                Array.isArray(params) ?
                    params.forEach(param => Objects.withParam(object, param)) :
                    Object.entries(params).forEach(param=>Objects.withParam(object, param[0], param[1]));
                return object;},
            withListener: Module.of((
                addListener=(object, paramKey, listener)=>object[paramKey[0].toUpperCase() + paramKey.substr(1)]
                    .addObserver(listener)
            ) => (object, paramKey, listener) => {
                Array.isArray(listener) ?
                    listener.forEach(individualListener=>addListener(object, paramKey, individualListener)) :
                    addListener(object, paramKey, listener);
                return object;}),
            withListeners: (object, paramListeners) => {
                Object.entries(paramListeners)
                    .forEach(paramListener => Objects.withListener(object, paramListener[0], paramListener[1]));
                return object;},
            withValidation: Module.of((
                addValidation=(object, paramKey, validation)=>object[paramKey[0].toUpperCase() + paramKey.substr(1)]
                    .addObserver(validation)
            ) => (object, paramKey, validation) => {
                Array.isArray(validation) ?
                    validation.forEach(individualValidation=>addValidation(object, paramKey, individualValidation)) :
                    addValidation(object, paramKey, validation);
                return object;}),
            withValidations: (object, paramValidations) => {
                Object.entries(paramValidations)
                    .forEach(paramValidation => Objects.withValidation(object, paramValidation[0], paramValidation[1]));
                return object;},
            withProperty: (object, key, property) => {
                Object.defineProperty(object, key, property);
                return object; },
            withProperties: (object, properties) => {
                Object.defineProperties(object, properties);
                return object},
            withModification: (object, modification) => {
                modification.bind(object)(object);
                return object; },
            withModifications: (object, ...modifications) => {
                modifications.forEach(mutation => mutation.bind(object)());
                return object; },
            withMethod: (object, name, method) => {
                object[name] = method.bind(object);
                return object; },
            withMethods: (object, methods) => {
                Object.keys(methods).forEach(key =>
                    object[key] = methods[key].bind(object));
                return object; },
            withSimpleBuilderSetters: (object, ...keys)=> Objects.withFields(object,
                Object.fromEntries(keys.map(key=>[
                    "with" + key.substr(0, 1).toUpperCase() + key.substr(1),
                    (object, value)=> Objects.withField(object, key, value)]))),
            withBuilder: (object, options={}) =>
                Objects.withField(object, "Builder",
                    builderize(object, Objects.withDefaults(options, defaultBuilderizeOptions)))}
    ) => Objects.withFields(Objects, {
            Builder: builderize(Objects),
            builderize: builderize,
            isNil: Module.of((nils = [null, undefined]) =>
                object => nils.includes(object)),
            sameKeyValues: (...keys) => Object.fromEntries(keys.map(key => [key, key])),
            withSameValue: (value, ...keys) => Object.fromEntries(keys.map(key => [key, value])),
            changeValues: (object, modifier) => Object.fromEntries(
                Object.entries(object).map(entry => [entry[0], modifier(entry[0])])),
            merge: (a, b, resolutions={}) => {
                const merged = Object.fromEntries(Object.entries(a));
                Object.entries(b).forEach(bEntry => Objects.isNil(merged[bEntry[0]]) ?
                    merged[bEntry[0]] = bEntry[1] :
                    resolutions[bEntry[0]]??merged[bEntry[0]]);
                return merged;}}));

    const Numbers = {
        goldenRatio: (1+Math.sqrt(5))/2,
        nCopies: (x, n) => Numbers.range(0, n).map(()=>x),
        range: (fromInclusive, toExclusive) => {
            let range = [];
            for(let i = fromInclusive; i < toExclusive; ++i) {
                range.push(i);}
            return range;},
        rangeInclusive: (fromInclusive, toInclusive) => Numbers.range(fromInclusive, toInclusive+1),
        clamp: (value, fromInclusive, toInclusive) => Math.min(Math.max(value, fromInclusive), toInclusive),
        toString: x => `${x}`,
        toDigitArray: x => {
            const xString = x.toString();
            return Arrays.reversed(Numbers.range(0, xString.length)).map(i=>Number.parseInt(xString.charAt(i)));},
        //Keys are the digit, values the value at that digit.
        //The result will be reversed from how the number's written,
        //e.g. the  number '120' will be returned as [0, 2, 1].
        fromDigitArray: x => x.reduce((number, value, digit) => number + value*Math.pow(10, digit), 0),
        digitValue: (number, digit) => Math.floor(number / Math.pow(10, digit))%10,
        randomIntegerInRange: (fromInclusive, toInclusive) =>
            Math.floor(Math.random() * (1 + toInclusive - fromInclusive) + fromInclusive)};

    const Arrays = {
        insertAt: (array, index, item) => {
            array.splice(index, 0, item);
            return array;},
        insertFirst: (array, item) => Arrays.insertAt(array, 0, item),
        doWhile: (array, f, condition) => {
            if(array.length === 0) return;
            let i = 0;
            do(f(array[i++]))
            while(condition() === false)
            return array;},
        replaceItem: (array, index, replacement) => {
            array[index] = replacement;
            return array;},
        removeItem: (array, item) => {
            const index = array.indexOf(item);
            if(index !== -1) {
                array.splice(index, 1);}},
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
        last: array => array[array.length - 1],
        distinct: array => array.reduce(
            (distinctElements, element) => distinctElements.includes(element) ?
                distinctElements :
                distinctElements.concat(element),
            []),
        multiSwap: (array, swapPairs) => {
            swapPairs.forEach(swapPair => {
                const placeholder = array[swapPair[0]];
                array[swapPair[0]] = array[swapPair[1]];
                array[swapPair[1]] = placeholder;});
            return array;},
        swap: (array, indexA, indexB) => {
            const placeholder = array[indexA];
            array[indexA] = array[indexB];
            array[indexB] = placeholder;
            return array;},
        reversed: array => Numbers.range(0, array.length).reverse().map(i=>array[i]),
        same: (a, b, comparator=(x,y)=>x===y) => a.length === b.length && a.every((x,i)=>comparator(x,b[i]))};

    const KeyboardCommands = Module.of(() => {
        const keyCommands = {};
        window.addEventListener("keydown", (e) => Functions.ifThen(
            e.key in keyCommands,
            keyCommands[e.key]));
        return {
            set: (key, command) => keyCommands[key] = command,
            setAll: keyCommandMap => Objects.withFields(keyCommands, keyCommandMap),
            remove: key => delete keyCommands[key],
            removeAll: keys => keys.forEach(key => delete keyCommands[key]) };});
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

    const Vector=Module.of((
        length=x=>Math.sqrt(x[0]*x[0]+x[1]*x[1]),
        multiply=(x, k) => [k*x[0],k*x[1]]
    ) => ({
        add: (a,b)=>[a[0]+b[0], a[1]+b[1]],
        minus: (a,b)=>[a[0]-b[0], a[1]-b[1]],
        multiply: multiply,
        length: length,
        norm: x=>multiply(x, 1/length(x)),
        angle: x=>Math.atan2(x[1], x[0])*180/Math.PI,
        dot: (a,b)=>a[0]*b[0] + a[1]*b[1],
        slope: x=>x[1]/x[0],
        project: (a, b) => Vector.multiply(b, Vector.dot(a, b) / Vector.dot(b, b))}));

    const Strings = Module.of((
        count=6,
        range=(min, max) => ({
            min: min,
            max: max}),
        all=Numbers.range(1, count+1)
    ) => ({
        count: 6,
        range: range,
        all: all,
        first: all[0],
        last: Arrays.last(all)}));

    const Fingers = Objects.withModification({
        thumb: "T",
        index: "1",
        middle: "2",
        ring: "3",
        pinky: "4",
        any: "*" },
        function() {
            this.all = Object.values(this);
            this.count = this.all.length;});

    const Frets = Objects.withModification({
        open: "o",
        first: 1,
        last: 15,
        maxRoot: 11,
        Relative: {
            root: 1,
            max: 5 },
        Range: Objects.withFields(
            (min, max) => ({
                min: min,
                max: max }),
            {equals: (a, b) => a.min === b.min && a.max === b.max})},
        function() {
            this.fretted = Numbers.range(this.first, this.last);
            this.roots = this.fretted.slice(0, this.maxRoot);
            this.roots.first = this.roots[0];
            this.roots.last = this.roots[this.roots.length-1];
            this.all = [this.open].concat(this.fretted);
            this.isFretted = this.fretted.includes;
            this.Relative = Module.of((
                all=Numbers.range(this.Relative.root, this.Relative.max+1)
            ) => ({
                all: all,
                count: all.length,
                first: all[0],
                last: all[all.length - 1]}));
            this.isOpen = fret => ! this.isFretted(fret);
            this.Range.roots = this.Range(this.roots.first, this.roots.last);});

    const SVG = Module.of((
        dashifyAttributeName = name =>
            Numbers.range(0, name.length)
                .map(charIndex => ((curChar) =>
                    curChar === curChar.toLowerCase() ?
                        curChar : "-" + curChar.toLowerCase())(
                    name.charAt(charIndex)))
                .join(""),
        /*
         * To avoid code duplication, this object 'left-click only's event listeners
         * Events are removed via the listener function, therefore
         * the modified left-click-only functions are stored in an element=>modified_listener Map,
         * to be retrieved/removed when the listener is removed from the element.
         */
        LeftMouseEvents = Module.of((
            elementListeners = new Map()
        ) => ({
            appliesToEventType: eventType => ["mousedown", "mouseup"].includes(eventType),
            registerEventListener: (element, eventType, listener) => {
                const listeners = Module.of((boundListener = listener.bind(element)) => ({
                    original: listener,
                    modified: function(e) {
                        //Left mouse button only
                        if(e.button === 0) {
                            boundListener(e);}}}));
                elementListeners.has(element) ?
                    elementListeners.get(element)[eventType].push(listeners) :
                    elementListeners.set(element, {
                        mousedown: eventType === "mousedown" ? [listeners] : [],
                        mouseup: eventType === "mouseup" ? [listeners] : []});
                return listeners.modified;},
            unregisterEventListener: (element, eventType, listener) => {
                if(! elementListeners.has(element)) {return;}
                const eventTypeListeners = elementListeners.get(element)[eventType];
                const indexListener = eventTypeListeners.findIndex((eventTypeListener =>
                    eventTypeListener.original === listener));
                if(indexListener === -1) {
                    return;}
                const modified = eventTypeListeners.splice(indexListener, 1)[0].modified;
                if(
                    elementListeners.get(element).mousedown.length === 0 &&
                    elementListeners.get(element).mouseup.length === 0) {
                    elementListeners.delete(element);}
                return modified;}}))
    ) => Objects
        .Builder(tagName => Objects.withField(
            document.createElementNS("http://www.w3.org/2000/svg", tagName),
            "customTransform",  //This is a hacky workaround to difficulties with something...
                                //mouse events with scaling and translation, if I remember correctly...
                                //definitely should have a better solution.
            {
                x: 0,
                y: 0,
                sx: 1,
                sy: 1,
                rotation: 0}))
        .withFields({
            withAttribute: (element, name, value) => {
                element.setAttribute(dashifyAttributeName(name), value);
                return element; },
            withAttributes: (element, attributes) => {
                Object.keys(attributes).forEach(name => {
                    element.setAttribute(dashifyAttributeName(name), attributes[name]);})
                return element; },
            withoutAttribute: (element, name) => {
                element.removeAttribute(name);
                return element; },
            withoutAttributes: (element, ...names) => {
                names.forEach(name => element.removeAttribute(name));
                return element; },
            withDataAttribute: (element, name, value) => {
                element.dataset[name] = value;
                return element; },
            withDataAttributes: (element, dataAttributes) => {
                Object.keys(dataAttributes).forEach(dataAttribute =>
                    element.dataset[dataAttribute] = dataAttributes[dataAttribute]);
                return element; },
            withClass: (element, className) => {
                element.classList.add(className);
                return element; },
            withClasses: (element, ...classes) => {
                element.classList.add(classes);
                return element; },
            withChild: (element, child) => {
                element.append(child);
                return element; },
            withChildren: (element, ...children) => {
                children.forEach(child => element.appendChild(child));
                return element; },
            withoutChild: (element, child) => {
                element.removeChild(child);
                return element;},
            withoutChildren: (element, ...children) => {
                children.forEach(child => element.removeChild(child));
                return element;},
            clearChildren: element => SVG.withoutChildren(element, ...Object.values(element.children)),
            withEventListener: Module.of((
                addEventListener = (element, eventType, listener) => element.addEventListener(
                    eventType,
                    LeftMouseEvents.appliesToEventType(eventType) ?
                        LeftMouseEvents.registerEventListener(element, eventType, listener) :
                        listener)
            ) => (element, eventType, listener) => {
                eventType = eventType.toLowerCase();
                Array.isArray(listener) ?
                    listener.forEach(aListener=> addEventListener(element, eventType, aListener)) :
                    addEventListener(element, eventType, listener);
                return element;}),
            withEventListeners: (element, eventListeners) => {
                Object.entries(eventListeners).forEach(listenerEntry =>
                    SVG.withEventListener(element, listenerEntry[0], listenerEntry[1]));
                return element; },
            withoutEventListener: (element, eventType, listener) => {
                eventType = eventType.toLowerCase();
                element.removeEventListener(eventType,
                    LeftMouseEvents.appliesToEventType(eventType) ?
                        LeftMouseEvents.unregisterEventListener(element, eventType, listener) :
                        listener);
                return element;},
            withoutEventListeners: (element, eventListeners) => {
                Object.entries(eventListeners).forEach(listenerEntry =>
                    SVG.withoutEventListener(element, listenerEntry[0], listenerEntry[1]));
                return element;},
            withAttributeChangeListener: (
                element,
                attributeName,
                listener,
                attributeExtractor=mutation=>mutation.target.getAttribute(attributeName)
            ) => {
                new MutationObserver(
                    mutations => mutations
                        .map(mutation => ({
                            oldValue: mutation.oldValue,
                            value: attributeExtractor.bind(mutation.target)(mutation),
                            target: mutation.target}))
                        .forEach(e => listener.bind(e.target)({
                            oldValue: e.oldValue,
                            value: e.value})))
                    .observe(element, {
                        attributeFilter: [attributeName],
                        attributeOldValue: true});
                return element;},
            withAttributeChangeListeners: (element, attributeChangeListeners) => {
                Object
                    .entries(attributeChangeListeners)
                    .forEach(entry => SVG.withAttributeChangeListener(
                        element,
                        entry[0],
                        entry[1].listener,
                        entry[1].attributeExtractor));
                return element;},
            withModification: Objects.withModification,
            hide: element => SVG.withAttribute(element, "display", "none"),
            show: element => SVG.withoutAttribute(element, "display"),
            disableTextSelection: element => {
                ["webkitUserSelect", "mozUserSelect", "msUserSelect", "userSelect"]
                    .forEach(selectAttribute => element.style[selectAttribute] = "none");
                return element; },
            updateTransform: (element, transformKey, values) => {
                const valuesString = values.join(" ");
                const transformAttribute = element.getAttribute("transform");
                if(transformAttribute === null) {   //Does the element have a transform attribute?
                    //No. Add it.
                    element.setAttribute("transform", `${transformKey}(${valuesString})`);
                    return element;}
                const indexTransform = transformAttribute.lastIndexOf(transformKey);
                if(indexTransform === -1) { //Does the transform attribute include a matching transform type?
                    //No. Create and append a transform of the given type the to attribute
                    element.setAttribute("transform",
                        `${transformAttribute} ${transformKey}(${valuesString})`);
                    return element;}
                //Transform of the given type does exist.
                //Replace the transform attribute with its arguments updated.
                const indexArgsStart = indexTransform + `${transformKey}(`.length;
                const indexArgsEnd = transformAttribute.indexOf(")", indexArgsStart);
                element.setAttribute("transform",
                    transformAttribute.slice(0, indexArgsStart) +
                    valuesString +
                    transformAttribute.slice(indexArgsEnd));
                return element;},
            move: (element, dx, dy) => {
                const translate = SVG.getTranslate(element);
                return SVG.moveTo(element, translate[0] + dx, translate[1] + dy);},
            moveTo: (element, newX, newY) => {
                const scale = SVG.getScale(element);
                return SVG.updateTransform(element, "translate", [newX/scale[0], newY/scale[1]]);},
            xTo: (element, x) => SVG.moveTo(element, x, SVG.getTranslate(element)[1]),
            yTo: (element, y) => SVG.moveTo(element, SVG.getTranslate(element)[0], y),
            rotateTo: (element, degrees, origin=[0,0]) =>
                SVG.updateTransform(element, "rotate", [degrees % 360, origin[0], origin[1]]),
            rotateBy: (element, degrees, origin=[0,0]) => SVG.rotateTo(
                element,
                SVG.getRotate(element)[0] + degrees,
                origin),
            scale: (element, scaleX, scaleY=scaleX) => {
                const scale = SVG.getScale(element);
                return SVG.updateTransform(element, "scale", [scale[0]*scaleX, scale[1]*scaleY]);},
            //Presentation attributes
            withColor: (element, color) => SVG.withAttribute(element, "color", color),
            withCursor: (element, cursor) => SVG.withAttribute(element, "cursor", cursor),
            withDisplay: (element, display) => SVG.withAttribute(element, "display", display),
            withDominantBaseline: (element, dominantBaseline) =>
                SVG.withAttribute(element, "dominant-baseline", dominantBaseline),
            withFill: (element, fill) => SVG.withAttribute(element, "fill", fill),
            withoutFill: element => SVG.withAttribute(element, "fill", "none"),
            withFillOpacity: (element, fillOpacity) => SVG.withAttribute(element, "fill-opacity", fillOpacity),
            withFontFamily: (element, fontFamily) => SVG.withAttribute(element, "font-family", fontFamily),
            withFontSize: (element, fontSize) => SVG.withAttribute(element, "font-size", fontSize),
            withOpacity: (element, opacity) => SVG.withAttribute(element, "opacity", opacity),
            withPointerEvents: (element, pointerEvents) => SVG.withAttribute(element, "pointer-events", pointerEvents),
            withoutPointerEvents: element => SVG.withAttribute(element, "pointer-events", "none"),
            withStroke: (element, stroke) => SVG.withAttribute(element, "stroke", stroke),
            withoutStroke: element => SVG.withAttribute(element, "stroke", "none"),
            withStrokeWidth: (element, strokeWidth) => SVG.withAttribute(element, "stroke-width", strokeWidth),
            withTextAnchor: (element, textAnchor) =>
                SVG.withAttribute(element, "text-anchor", textAnchor),
            withTextDecoration: (element, textDecoration) =>
                SVG.withAttribute(element, "text-decoration", textDecoration),
            leftAlign: element => SVG.withTextAnchor(element, SVG.Attributes.Presentation.TextAnchor.start),
            centerAlign: element => SVG.withTextAnchor(element, SVG.Attributes.Presentation.TextAnchor.middle),
            rightAlign: element => SVG.withTextAnchor(element, SVG.Attributes.Presentation.TextAnchor.end),
            topAlign: element =>
                SVG.withDominantBaseline(element, SVG.Attributes.Presentation.DominantBaseline.auto),
            centerAlignVertical: element =>
                SVG.withDominantBaseline(element, SVG.Attributes.Presentation.DominantBaseline.middle),
            bottomAlign: element =>
                SVG.withDominantBaseline(element, SVG.Attributes.Presentation.DominantBaseline.hanging),
            centerAlignBoth: element => SVG.Builder(element)
                .centerAlign()
                .centerAlignVertical()
                .build()})
        .withBuilder({defaultInitial: undefined})
        .withFields({
            getTransform: (element, type)=> {
                const transformAttribute = element.getAttribute("transform");
                if(transformAttribute === null) {
                    return SVG.Attributes.Transform[type].identity;}
                const indexType = transformAttribute.indexOf(type);
                return indexType === -1 ?
                    SVG.Attributes.Transform[type].identity :
                    SVG.Attributes.Transform[type].parse(transformAttribute.substring(
                        transformAttribute.indexOf("(", indexType) + 1,
                        transformAttribute.indexOf(")", indexType)));},
            getTranslate: element=> SVG.getTransform(element, "translate"),
            getScale: element=> SVG.getTransform(element, "scale"),
            getRotate: element=> SVG.getTransform(element, "rotate"),
            G: () => SVG("g"),
            Circle: Objects
                .Builder((center=[0,0], radius=1)=>SVG.Circle.Builder(SVG("circle"))
                    .withCenter(center)
                    .withRadius(radius)
                    .build())
                .withFields({
                    withCenterX: (circle, centerX) => SVG.withAttribute(circle, "cx", centerX),
                    withCenterY: (circle, centerY) => SVG.withAttribute(circle, "cy", centerY),
                    withCenter: (circle, center) => SVG.Circle.Builder(circle)
                        .withCenterX(center[0])
                        .withCenterY(center[1])
                        .build(),
                    withRadius: (circle, radius) => SVG.withAttribute(circle, "r", radius)})
                .withBuilder({initializer: () => SVG.Circle()})
                .withFields({
                    getCenterX: ellipse=>ellipse.getAttribute("cx"),
                    getCenterY: ellipse=>ellipse.getAttribute("cy"),
                    getCenter: ellipse=>[
                        SVG.Ellipse.getCenterX(ellipse),
                        SVG.Ellipse.getCenterY(ellipse)],
                    getRadius: ellipse=>ellipse.getAttribute("r")})
                .build(),
            Ellipse: Objects
                .Builder(()=>SVG("ellipse"))
                .withFields({
                    withCenterX: (ellipse, centerX) => SVG.withAttribute(ellipse, "cx", centerX),
                    withCenterY: (ellipse, centerY) => SVG.withAttribute(ellipse, "cy", centerY),
                    withCenter: (ellipse, center) => SVG.Circle.Builder(ellipse)
                        .withCenterX(center[0])
                        .withCenterY(center[1])
                        .build(),
                    withRadiusX: (ellipse, radiusX) => SVG.withAttribute(ellipse, "rx", radiusX),
                    withRadiusY: (ellipse, radiusY) => SVG.withAttribute(ellipse, "ry", radiusY),
                    withRadius: (ellipse, radius) => SVG.Ellipse.Builder(ellipse)
                        .withRadiusX(radius[0])
                        .withRadiusY(radius[1])
                        .build()})
                .withBuilder({initializer: () => SVG.Ellipse()})
                .withFields({
                    getCenterX: ellipse=>ellipse.getAttribute("cx"),
                    getCenterY: ellipse=>ellipse.getAttribute("cy"),
                    getCenter: ellipse=>[
                        SVG.Ellipse.getCenterX(ellipse),
                        SVG.Ellipse.getCenterY(ellipse)],
                    getRadiusX: ellipse=>ellipse.getAttribute("rx"),
                    getRadiusY: ellipse=>ellipse.getAttribute("ry"),
                    getRadius: ellipse=>[
                        SVG.Ellipse.getRadiusX(ellipse),
                        SVG.Ellipse.getRadiusY(ellipse)]})
                .build(),
            Line: Objects
                .Builder((a=[10, 10], b=[40, 10])=>SVG.Line.withEndpoints(SVG("line"), a, b))
                .withFields({
                    withX1: (line, x1) => SVG.withAttribute(line, "x1", x1),
                    withX2: (line, x2) => SVG.withAttribute(line, "x2", x2),
                    withY1: (line, y1) => SVG.withAttribute(line, "y1", y1),
                    withY2: (line, y2) => SVG.withAttribute(line, "y2", y2),
                    withA: (line, a) => SVG.Line.Builder(line)
                        .withX1(a[0])
                        .withY1(a[1])
                        .build(),
                    withB: (line, b) => SVG.Line.Builder(line)
                        .withX2(b[0])
                        .withY2(b[1])
                        .build(),
                    withEndpoints: (line, a, b) => SVG.Line.Builder(line)
                        .withA(a)
                        .withB(b)
                        .build()})
                .withBuilder({initializer: () => SVG.Line()})
                .withFields({
                    getX1: line => line.getAttribute("x1"),
                    getX2: line => line.getAttribute("x2"),
                    getY1: line => line.getAttribute("y1"),
                    getY2: line => line.getAttribute("y2"),
                    getA: line => [
                        SVG.Line.getX1(line),
                        SVG.Line.getY1(line)],
                    getB: line => [
                        SVG.Line.getX2(line),
                        SVG.Line.getY2(line)],
                    getEndpoints: line => [
                        SVG.Line.getA(line),
                        SVG.Line.getB(line)]})
                .build(),
            Path: Objects.Builder((d="")=>SVG.Path.withD(SVG("path"), d))
                .withField("withD", (path, d) => SVG.withAttribute(path, "d", d))
                .withBuilder({initializer: () => SVG.Path()})
                .withField("getD", path => path.getAttribute("d"))
                .build(),
            Rect: Objects
                .Builder(options=> Objects.withGettersAndSetters(
                    SVG.withAttributes(SVG("rect"),
                        {
                            x: options.x??0,
                            y: options.y??0,
                            width: options.width??10,
                            height: options.height??10}),
                    {
                        x: {
                            get: function() {
                                return Number.parseInt(this.getAttribute("x"));},
                            set: function(value) {
                                this.setAttribute("x", value);}},
                        y: {
                            get: function() {
                                return Number.parseInt(this.getAttribute("y"));},
                            set: function(value) {
                                this.setAttribute("y", value);}},
                        width: {
                            get: function() {
                                return Number.parseInt(this.getAttribute("width"));},
                            set: function(value) {
                                this.setAttribute("width", value);}},
                        height: {
                            get: function() {
                                return Number.parseInt(this.getAttribute("height"));},
                            set: function(value) {
                                this.setAttribute("height", value);}}}))
                .withFields({
                    withWidth: (rect, width) => SVG.withAttribute(rect, "width", width),
                    withHeight: (rect, height) => SVG.withAttribute(rect, "height", height),
                    resize: (rect, width, height) => SVG.Rect.Builder(rect)
                        .withWidth(width)
                        .withHeight(height)
                        .build(),
                    withRx: (rect, rx) => SVG.withAttribute(rect, "rx", rx),
                    withRy: (rect, ry) => SVG.withAttribute(rect, "ry", ry),
                    withRadius: (rect, radius) => SVG.Rect.Builder(rect)
                        .withRx(radius)
                        .withRy(radius)
                        .build()})
                .withBuilder({initializer: () => SVG.Rect()})
                .withFields({
                    getWidth: rect => rect.getAttribute("width"),
                    getHeight: rect => rect.getAttribute("height"),
                    getRx: rect => rect.getAttribute("rx"),
                    getRy: rect => rect.getAttribute("ry")})
                .build(),
            SVG: Objects.Builder(()=>SVG("svg"))
                .withFields({
                    withWidth: (svg, width) => SVG.withAttribute(svg, "width", width),
                    withHeight: (svg, height) => SVG.withAttribute(svg, "height", height),
                    withPreserveAspectRatio: (svg, value) =>
                        SVG.withAttribute(svg, "preserveAspectRatio", value),
                    withViewBox: (svg, x, y, width, height) =>
                        SVG.withAttribute(svg, "viewBox", `${x} ${y} ${width} ${height}`)})
                .withBuilder({initializer: () => SVG.SVG()})
                .withFields({
                    getWidth: svg=>svg.getAttribute("width"),
                    getHeight: svg=>svg.getAttribute("height"),
                    getPreserveAspectRatio: svg=>svg.getAttribute("preserveAspectRatio"),
                    getViewBox: svg=>svg.getAttribute("viewBox")})
                .build(),
            Text: Objects
                .Builder((text="")=>SVG.Text.withTextContent(
                    SVG.Builder(SVG("text"))
                        .withoutStroke()
                        .withFill(Style.textColor)
                        .withFontFamily("Courier New")
                        .withAttribute("text-content", text)
                        .build(),
                    text))
                .withFields({
                    withTextContent: (text, content) => {
                        text.textContent = content;
                        return text;},
                    withoutTextContent: text => {
                        text.textContent = null;
                        return text;},
                    withX: (text, x) => SVG.withAttribute(text, "x", x),
                    withY: (text, y) => SVG.withAttribute(text, "y", y),
                    withDx: (text, dx) => SVG.withAttribute(text, "dx", dx),
                    withDy: (text, dy) => SVG.withAttribute(text, "dy", dy),
                    withRotate: (text, rotate) => SVG.withAttribute(text, "rotate", rotate),
                    withLengthAdjust: (text, lengthAdjust) => SVG.withAttribute(text, "lengthAdjust", lengthAdjust),
                    withTextLength: (text, textLength) => SVG.withAttribute(text, "textLength", textLength)})
                .withBuilder({initializer: () => SVG.Text()})
                .withFields({
                    getX: text => text.getAttribute("x"),
                    getY: text => text.getAttribute("y"),
                    getDx: text => text.getAttribute("dx"),
                    getDy: text => text.getAttribute("dy"),
                    getRotate: text => text.getAttribute("rotate"),
                    getLengthAdjust: text => text.getAttribute("lengthAdjust"),
                    getTextLength: text => text.getAttribute("textLength")})
                .build(),
            Attributes: {
                Presentation: {
                    Cursor: {
                        auto: "auto",
                        crosshair: "crosshair",
                        default: "default",
                        pointer: "pointer",
                        move: "move",
                        eResize: "e-resize",
                        neResize: "ne-resize",
                        nwResize: "nw-resize",
                        nResize: "n-resize",
                        seResize: "se-resize",
                        swResize: "sw-resize",
                        sResize: "s-resize",
                        wResize: "w-resize",
                        text: "text",
                        wait: "wait",
                        help: "help"},
                    DominantBaseline: {
                        auto: "auto",
                        textBottom: "text-bottom",
                        alphabetic: "alphabetic",
                        ideographic: "ideographic",
                        middle: "middle",
                        central: "central",
                        mathematical: "mathematical",
                        hanging: "hanging",
                        textTop: "text-top"},
                    PointerEvents: {
                        boundingBox: "bounding-box",
                        visiblePainted: "visible-painted",
                        visibleFill: "visible-fill",
                        visibleStroke: "visible-stroke",
                        visible: "visible",
                        painted: "painted",
                        fill: "fill",
                        stroke: "stroke",
                        all: "all",
                        none: "none"},
                    TextAnchor: {
                        start: "start",
                        middle: "middle",
                        end: "end"},
                    TextDecoration: {
                        Line: {
                            none: "none",
                            underline: "underline",
                            overline: "overline",
                            lineThrough: "line-through"},
                        Style: {
                            solid: "solid",
                            double: "double",
                            dotted: "dotted",
                            dashed: "dashed",
                            wavy: "wavy"}}},
                Transform: {
                    translate: {
                        identity: [0, 0],
                        parse: string=> string.split(/[\s,]/).map(x=> Number.parseFloat(x.trim()))},
                    rotate: {
                        identity: 0,
                        parse: string=> Number.parseFloat(string.split(/[\s,]/)[0].trim())},
                    scale: {
                        identity: [1, 1],
                        parse: string=> string.split(/[\s,]/).map(x=> Number.parseFloat(x.trim()))},
                    skewX: {
                        identity: 0,
                        parse: string=> Number.parseFloat(string.trim())},
                    skewY: {
                        identity: 0,
                        parse: string=> Number.parseFloat(string.trim())}}},
            Compositions: Module.of((
                parseCellSize= (defaultCellSize, actualCellSize)=>
                    Objects.isNil(actualCellSize) ?
                        {
                            width: defaultCellSize,
                            height: defaultCellSize} :
                    typeof actualCellSize === "number" ?
                        {
                            width: actualCellSize,
                            height: actualCellSize} :
                        {
                            width: typeof actualCellSize.width === "number" ?
                                actualCellSize.width : defaultCellSize,
                            height: typeof actualCellSize.height === "number" ?
                                actualCellSize.height : defaultCellSize}
            )=> ({
                /**
                 * An AbstractEnumInput selects zero to one given values by clicking regions in space.
                 * Mousing over previews the selection if clicked.
                 * It is Abstract in that it is an invisible mouse region, expected to be a part of other compositions.
                 * Selections can be continuously updated during mouse drags, triggering a 'selectComplete'
                 *     event upon mouse up.
                 * Constructed given the width and height (of the underlying MouseRegion, list of values,
                 *  a 'pointToValue' function of the form (x,y,values)=> ... that returns the value
                 *      at the given (x,y) coordinate or null,
                 *  and a 'listeners' field with the following event type subfields (functions that accepts a value) -
                 *      preview
                 *      unpreview
                 *      select
                 *      selectComplete (upon mouse up, as oppose to mouse drag)
                 *      unselect
                 */
                AbstractEnumInput: Module.of((
                    EventTypes=["preview", "unpreview", "select", "selectComplete", "unselect"],
                    defaults = {
                        width: 300,
                        height: 300,
                        values: [],
                        pointToValue: undefined,
                        listeners: Objects.withSameValue(Functions.noop, ...EventTypes)},
                ) => Objects.Builder((options={}) =>
                    Module.of((
                        values=options.values??defaults.values,
                        pointToValue = options.pointToValue,
                        listeners=Object.fromEntries(EventTypes.map(key =>
                            [key, options.listeners[key]??defaults.listeners[key]])),
                        Preview=Module.of((value=null) => ({
                            get: () => value,
                            set: newValue => {
                                if(value === newValue || ! [null].concat(values.includes(newValue))) return;
                                if(value !== null) {
                                    listeners.unpreview(value);}
                                value = newValue;
                                if(! [null, Selection.get()].includes(value)) {
                                    listeners.preview(value);}},
                            unset: () => Preview.set(null)})),
                        Selection=Module.of((value=null) => ({
                            get: () => value,
                            set: newValue => {
                                if(value === newValue || ! [null].concat(values.includes(newValue))) return;
                                if(value !== null) {
                                    listeners.unselect(value);}
                                value = newValue;
                                if(value !== null) {
                                    listeners.select(value);}},
                            unset: () => Selection.set(null)})),
                        mouseRegion=SVG.Compositions.MouseRegion({
                            width: options.width??defaults.width,
                            height: options.height??defaults.height,
                            listeners: {
                                enter: function(e) {
                                    SVG.Compositions.AbstractEnumInput.closestPreviewed(
                                        this.parentNode, ...e.position);},
                                leave: function(e) {
                                    if(e.dragTarget !== this) {
                                        SVG.Compositions.AbstractEnumInput.unpreviewed(this.parentNode);}},
                                move: function(e) {
                                    SVG.Compositions.AbstractEnumInput[
                                        `closest${e.dragTarget === this ? "Select" : "Preview"}ed`
                                        ](this.parentNode, ...e.position);},
                                down: function(e) {
                                    Preview.unset();
                                    SVG.Compositions.AbstractEnumInput.closestSelected(
                                        this.parentNode, ...e.position);},
                                up: function() {
                                    listeners.selectComplete(Selection.get());}}})
                    ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                            .withClass("abstract-enum-input")
                            .withChild(mouseRegion)
                            .build())
                        .withFields({
                            listeners: listeners,
                            pointToValue: pointToValue})
                        .withGettersAndSetters({
                            values: {
                                get: () => values},
                            mouseRegion: {
                                get: () => mouseRegion},
                            preview: {
                                get: Preview.get,
                                set: Preview.set},
                            selection: {
                                get: Selection.get,
                                set: Selection.set}})
                        .build()))
                    .withFields({
                        withValues: (input, values) => {
                            input.values = values;
                            return input;},
                        addValue: (input, ...values) => {
                            input.values.push(...values);
                            return input;},
                        withWidth: (input, width) => {
                            input.mouseRegion.width = width;
                            return input;},
                        withHeight: (input, height) => {
                            input.mouseRegion.height = height;
                            return height;},
                        previewing: (input, value) => {
                            input.preview = value;
                            return input;},
                        unpreviewed: input => SVG.Compositions.AbstractEnumInput.previewing(input, null),
                        selecting: (input, value) => {
                            input.selection = value;
                            return input;},
                        unselected: input => SVG.Compositions.AbstractEnumInput.selecting(input, null),
                        closestPreviewed: (input, x, y) => SVG.Compositions.AbstractEnumInput.previewing(
                            input,
                            input.pointToValue(x, y, input.values)),
                        closestSelected: (input, x, y) => SVG.Compositions.AbstractEnumInput.selecting(
                            input,
                            input.pointToValue(x, y, input.values))})
                    .withBuilder()
                    .withFields({
                        /**
                         * Replaces 'width', 'height', and 'pointToValue' fields in options with
                         *      'cellSize' that may be either a Number or an object with width and height fields, and
                         *      'columns', the values per row.
                         */
                        Grid: Module.of((
                            defaultCellSize=25,
                            defaultColumns=5,
                            rowIndex= (columns, cellIndex)=> Math.floor(cellIndex / columns),
                            numRows= (columns, numValues)=> rowIndex(columns, Math.max(0, numValues-1)),
                            calcHeight= (cellHeight, columns, numValues)=> cellHeight * numRows(columns, numValues),
                            updateSize= grid=> SVG.Compositions.AbstractEnumInput.Builder(grid)
                                .withWidth(grid.cellSize.width * grid.columns)
                                .withHeight(calcHeight(grid.cellSize.height, grid.columns, grid.values.length))
                                .build()
                        )=> Objects.Builder(
                            options=> Module.of((
                                cellSize=parseCellSize(defaultCellSize, options.cellSize),
                                 columns= options.columns??defaultColumns
                            ) => Objects.Builder(
                                SVG.Compositions.AbstractEnumInput(Objects.withFields(options, {
                                    width: cellSize * columns,
                                    height: calcHeight(cellSize.height, columns, (options.values??[]).length),
                                    pointToValue: (x, y, values)=> {
                                        const row = Functions.binarySearch(
                                            Numbers.range(0, numRows(columns, values.length)),
                                            rowIndex=>
                                                y < rowIndex * cellSize.height ? -1 :
                                                y >= (rowIndex+1) * cellSize.height ? 1 : 0);
                                        const column = Functions.binarySearch(
                                            Numbers.range(0, columns),
                                            columnIndex=>
                                                x < columnIndex * cellSize.width ? -1 :
                                                x >= (columnIndex+1) * cellSize.width ? 1 : 0);
                                        const index = row * columns + column;
                                        return index > values.length ? undefined : values[index];}})))
                                .withGettersAndSetters({
                                    cellSize: {
                                        get: () => cellSize,
                                        set: function(value) {
                                            cellSize = {
                                                width: typeof value === "number" ?
                                                    value :
                                                    value.width??cellSize.width,
                                                height: typeof value === "number" ?
                                                    value :
                                                    value.height??cellSize.height};
                                            updateSize(this);}},
                                    columns: {
                                        get: () => columns,
                                        set: function(value) {
                                            columns = value;
                                            updateSize(this);}}})
                                .build()))
                            .withFields({
                                withCellSize: (abstractEnumGrid, cellSize)=> {
                                    abstractEnumGrid.cellSize = cellSize;
                                    return abstractEnumGrid;},
                                withColumns: (abstractEnumGrid, columns)=> {
                                    abstractEnumGrid.columns = columns;
                                    return abstractEnumGrid;}})
                            .withBuilder()
                            .build()),
                        /**
                         * Replaces 'width', 'height', and 'pointToValue' fields in options with
                         *      'layout' that may be either "horizontal" or "vertical", and
                         *      'cellSize' that may be either a Number or an object with width and height fields
                         */
                        Strip: Module.of((
                            defaultCellSize=25,
                            defaultLayout = "horizontal",
                            calcWidth= (layout, cellSize, numValues)=> cellSize.width * (
                                layout==="vertical" ? 1 : numValues),
                            calcHeight= (layout, cellSize, numValues)=> cellSize.height * (
                                layout==="vertical" ? numValues : 1),
                        ) => Objects.Builder(
                            options=> Module.of((
                                cellSize= parseCellSize(defaultCellSize, options.cellSize),
                                layout= ["horizontal", "vertical"].includes(options.layout) ?
                                    options.layout : defaultLayout
                            ) => Objects.Builder(
                                SVG.Compositions.AbstractEnumInput(Objects.withFields(options, {
                                    width: calcWidth(layout, cellSize, (options.values??[]).length),
                                    height: calcHeight(layout, cellSize, (options.values??[]).length),
                                    pointToValue: (x, y, values)=> Functions.binarySearch(
                                        values,
                                        layout === "vertical" ?
                                            (value, i)=>
                                                y < i * cellSize.height ? -1 :
                                                y >= (i+1) * cellSize.height ? 1 : 0 :
                                            (value, i)=>
                                                x < i * cellSize.width ? -1 :
                                                x >= (i+1) * cellSize.width ? 1 : 0)})))
                                .withGettersAndSetters({
                                    cellSize: {
                                        get: ()=> cellSize,
                                        set: function(value) {
                                            cellSize = {
                                                width: typeof value === "number" ?
                                                    value :
                                                    value.width??cellSize.width,
                                                height: typeof value === "number" ?
                                                    value :
                                                    value.height??cellSize.height};
                                            SVG.Compositions.AbstractEnumInput.Builder(this)
                                                .withWidth(calcWidth(layout, cellSize, this.values.length))
                                                .withHeight(calcHeight(layout, cellSize, this.values.length))
                                                .build();}},
                                    layout: {
                                        get: ()=> layout,
                                        set: function(value) {
                                            layout = value;
                                            SVG.Compositions.AbstractEnumInput.Builder(this)
                                                .withWidth(calcWidth(layout, cellSize, this.values.length))
                                                .withHeight(calcHeight(layout, cellSize, this.values.length))
                                                .build();}}})
                                .build()))
                            .withFields({
                                withCellSize: (abstractEnumStrip, cellSize)=> {
                                    abstractEnumStrip.cellSize = cellSize;
                                    return abstractEnumStrip;},
                                withCellWidth: (abstractEnumStrip, cellWidth)=> {
                                    abstractEnumStrip.cellSize = {
                                        width: cellWidth,
                                        height: abstractEnumStrip.cellSize.height};
                                    return abstractEnumStrip;},
                                withCellHeight: (abstractEnumStrip, cellHeight)=> {
                                    abstractEnumStrip.cellSize = {
                                        width: abstractEnumStrip.cellSize.width,
                                        height: cellHeight};
                                    return abstractEnumStrip;},
                                withLayout: (abstractEnumStrip, layout)=> {
                                    abstractEnumStrip.layout = layout;
                                    return abstractEnumStrip;}})
                            .withBuilder()
                            .build())})
                    .build()),
                ActionText: Module.of((
                    defaults= {
                        text: "action text",
                        width: 300,
                        height: 100,
                        clickListener: Functions.noop}
                ) => Objects.Builder((optionsArg={})=>Module.of((
                    options=Objects.withDefaults(optionsArg, defaults),
                    label = SVG.Builder(SVG.Text(options.text))
                        .centerAlignBoth()
                        .withFontFamily("monospace")
                        .withFontSize(15)
                        .build(),
                    mouseRegion=SVG.Compositions.MouseRegion({
                        x: -.5*options.width,
                        y: -.5*options.height,
                        width: options.width,
                        height: options.height,
                        listeners: {
                            enter: function(e) {
                                SVG.Compositions.ActionText[
                                    e.dragTarget === this ? "active" : "preview"
                                ](this.parentElement);},
                            leave: function(e) {
                                SVG.Compositions.ActionText[
                                    e.dragTarget === this ? "preview" : "inactive"
                                ](this.parentElement);},
                            down: function() {
                                SVG.Compositions.ActionText.active(this.parentElement);},
                            up: function(e) {
                                if(e.mouseOverTarget === this) {
                                    SVG.Compositions.ActionText.preview(this.parentElement);
                                    this.parentElement.clickListener();}
                                else {
                                    SVG.Compositions.ActionText.inactive(this.parentElement);}}}})
                    ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                            .withClass("action-text")
                            .withChildren(label, mouseRegion)
                            .build())
                        .withGetters({
                            label: () => label,
                            mouseRegion: () => mouseRegion})
                        .withFields({
                            clickListener: options.clickListener})
                        .build()))
                    .withFields({
                        withClickListener: (actionText, listener) => {
                            actionText.clickListener = listener;
                            return actionText;},
                        withText: (actionText, text) => {
                            SVG.Text.withTextContent(actionText.label, text);
                            return actionText;},
                        withWidth: (actionText, width) => {
                            SVG.Rect.withWidth(actionText.mouseRegion, width);
                            return actionText;},
                        withHeight: (actionText, height) => {
                            SVG.Rect.withHeight(actionText.mouseRegion, height);
                            return actionText;},
                        preview: actionText=>{
                            SVG.withTextDecoration(actionText.label, "underline dashed");
                            return actionText;},
                        inactive: actionText=>{
                            SVG.withTextDecoration(actionText.label, "none");
                            return actionText;},
                        active: actionText=>{
                            SVG.withTextDecoration(actionText.label, "underline solid");
                            return actionText;}})
                    .withBuilder()
                    .build()),
                EnumInput: Module.of((
                    Layout=Objects.sameKeyValues("horizontal", "vertical"),
                    LabelPosition=Objects.sameKeyValues("left", "right", "above", "below", "none"),
                    EnumInputStyle={
                        cells: {
                            stroke: Style.colors.black,
                            unselected: {
                                fill: Style.colors.white,
                                strokeWidth: 1},
                            preview: {
                                fill: Style.colors.white,
                                strokeWidth: 2},
                            selected: {
                                fill: Style.colors.black,
                                strokeWidth: 1}}},
                    defaults={
                        values: Numbers.range(1, 11),
                        value: null,
                        layout: Layout.horizontal,
                        labelPosition: LabelPosition.above,
                        labelMargin: 5,
                        cellSize: 25,
                        changeListener: Functions.noop},
                    calcColumns=(layout, numValues)=> layout === Layout.horizontal ? numValues : 1,
                    positionLabels= (labels, labelPosition, labelMargin, cellSize)=> SVG.Builder(labels)
                        .moveTo(
                            labelPosition === LabelPosition.left ? -labelMargin :
                                labelPosition === LabelPosition.right ? cellSize.width + labelMargin :
                                .5 * cellSize.width,
                            labelPosition === LabelPosition.above ? -labelMargin :
                                labelPosition === LabelPosition.below ? cellSize.height + labelMargin :
                                .5 * cellSize.height)
                        .withDominantBaseline(
                            labelPosition === LabelPosition.above ? "auto" :
                                labelPosition === LabelPosition.below ? "hanging" : "middle")
                        .withTextAnchor(
                            labelPosition === LabelPosition.left ? "end" :
                                labelPosition === LabelPosition.right ? "start" : "middle")
                        .withDisplay(labelPosition === LabelPosition.none ? "none" : null)
                        .build(),
                    createCellModules= (cellSize, values)=> Numbers.range(0, values.length)
                        .map(()=>SVG.withAttributes(
                            SVG.Rect({
                                width: cellSize.width,
                                height: cellSize.height}),
                            Objects.withField(
                                EnumInputStyle.cells.unselected, "stroke", EnumInputStyle.cells.stroke))),
                    createLabelModules= values=> values.map(SVG.Text)
                )=> Objects
                    .Builder((options={})=> Module.of((
                        values=options.values??defaults.values,
                        layout=options.layout??defaults.layout,
                        labelPosition=options.labelPosition??defaults.labelPosition,
                        labelMargin=options.labelMargin??defaults.labelMargin,
                        cellSize=parseCellSize(defaults.cellSize, options.cellSize),
                        changeListener=options.changeListener??defaults.changeListener,
                        columns=calcColumns(layout, values.length),
                        cells=SVG.Compositions.ModularGrid({
                            modules: createCellModules(cellSize, values),
                            columns: columns,
                            moduleSize: cellSize,
                            padding: 0}),
                        labels= positionLabels(
                            SVG.Compositions.ModularGrid({
                                modules: createLabelModules(values),
                                columns: columns,
                                moduleSize: cellSize,
                                padding: 0}),
                            labelPosition, labelMargin, cellSize),
                        controller=SVG.Compositions.AbstractEnumInput.Strip({
                            layout: layout,
                            cellSize: cellSize,
                            values: Numbers.range(0, values.length),
                            listeners: {
                                preview: value=> SVG.withAttributes(cells.modules[value], EnumInputStyle.cells.preview),
                                unpreview: value=> SVG.withAttributes(cells.modules[value],
                                    value === controller.selection ?
                                        EnumInputStyle.cells.selected :
                                        EnumInputStyle.cells.unselected),
                                select: value=> {
                                    SVG.withAttributes(cells.modules[value], EnumInputStyle.cells.selected);
                                    changeListener(cells.modules[value], value);},
                                unselect: value=> SVG.withAttributes(
                                    cells.modules[value], EnumInputStyle.cells.unselected)}})
                    ) => SVG.Compositions.EnumInput.withValue(
                        Objects.Builder(
                            SVG.Builder(SVG.G())
                                .withClass("enum-input")
                                .withChildren(cells, labels, controller)
                                .build())
                            .withGettersAndSetters({
                                values: {
                                    get: () => values,
                                    set: value=> {
                                        values = value;
                                        columns = calcColumns(layout, values.length);
                                        cells.columns = columns;
                                        cells.modules = createCellModules(cellSize, values);
                                        labels.columns = columns;
                                        labels.modules = createLabelModules(values);
                                        controller.values= Numbers.range(0, values.length);}},
                                layout: {
                                    get: () => layout,
                                    set: value=> {
                                        layout = value;
                                        columns= calcColumns(layout, values.length);
                                        cells.columns = columns;
                                        labels.columns = columns;
                                        controller.layout = layout;}},
                                labelPosition: {
                                    get: () => labelPosition,
                                    set: value=> {
                                        labelPosition = value;
                                        labels= positionLabels(labels, labelPosition, labelMargin, cellSize);}},
                                labelMargin: {
                                    get: () => labelMargin,
                                    set: value=> {
                                        labelMargin = value;
                                        labels= positionLabels(labels, labelPosition, labelMargin, cellSize);}},
                                cellSize: {
                                    get: () => cellSize,
                                    set: value=> {
                                        cellSize = parseCellSize(defaults.cellSize, value);
                                        cells.modules.forEach(cell=>
                                            SVG.Rect.resize(cell, cellSize.width, cellSize.height));
                                        cells.moduleSize = cellSize;
                                        labels= positionLabels(labels, labelPosition, labelMargin, cellSize);
                                        labels.moduleSize = cellSize;
                                        controller.cellSize = cellSize;}},
                                changeListener: {
                                    get: () => changeListener,
                                    set: value=> changeListener = value},
                                value: {
                                    get: ()=> values[controller.selection],
                                    set: value=> controller.selection = values.indexOf(value)},
                                valueIndex: {
                                    get: () => controller.selection,
                                    set: index=> controller.selection = index}})
                            .withGetters({
                                cells: () => cells,
                                labels: () => labels,
                                controller: () => controller})
                            .build(),
                        options.value??values[0])))
                    .withSimpleBuilderSetters(
                        "layout", "labelPosition", "labelMargin", "cellSize", "changeListener", "value")
                    .withBuilder()
                    .withFields({
                        Number: Module.of((
                            defaults={
                                min: 1,
                                max: 10},
                            values= (min, max) => Numbers.range(min, 1+max)
                        ) => Objects.Builder(options=> Module.of((
                            min= options.min??defaults.min,
                            max= options.max??defaults.max
                        ) => Objects.Builder(
                            SVG.withClass(
                                SVG.Compositions.EnumInput(Objects.withField(options, "values", values(min, max))),
                                "number-input"))
                            .withGettersAndSetters({
                                min: {
                                    get: () => min,
                                    set: function(value) {
                                        min = value;
                                        this.values = values(min, max);}},
                                max: {
                                    get: () => max,
                                    set: function(value) {
                                        max = value;
                                        this.values = values(min, max);}}})
                            .withGetterAndSetter("value",
                                function() {
                                    return min + this.controller.selection;},
                                function(value) {
                                    const number = Number.parseInt(value);
                                    if(Number.isNaN(number)) {
                                        return;}
                                    this.controller.selection = value - min;})
                            .build()))
                        .withSimpleBuilderSetters("min", "max")
                        .withBuilder()
                        .build())})
                    .build()),
                /**
                 * A container for arranging elements in a grid.
                 */
                ModularGrid: Module.of((
                    Alignment= {
                        Horizontal: Objects.sameKeyValues("left", "center", "right"),
                        Vertical: Objects.sameKeyValues("top", "center", "bottom")},
                    Overflow= Objects.sameKeyValues("left", "center", "right"),
                    defaults= {
                        modules: [],
                        moduleSize: {
                            width: 10,
                            height: 10},
                        padding: {
                            horizontal: 10,
                            vertical: 10},
                        columns: 4,
                        alignment: {
                            //Determines where the modules are positioned within the
                            // [[0,0],[moduleSize.width, moduleSize.height]] rectangle
                            horizontal: Alignment.Horizontal.left,
                            vertical: Alignment.Vertical.top},
                        overflow: Overflow.center},
                    withPositionedModules=modularGrid=>{
                        SVG.Compositions.ModularGrid.positions(modularGrid).forEach((position, index) =>
                            SVG.moveTo(modularGrid.modules[index], ...position));
                        return modularGrid;}
                ) => Objects
                    .Builder((options={}) => Module.of((
                        modules= options.modules??defaults.modules,
                        moduleSize= Module.of(
                            (width, height) => Objects.withGettersAndSetters({}, {
                                width: {
                                    get: () => width,
                                    set: newWidth => {
                                        if(width === newWidth) return;
                                        width = newWidth;
                                        withPositionedModules(me);}},
                                height: {
                                    get: () => height,
                                    set: newHeight => {
                                        if(height === newHeight) return;
                                        height = newHeight;
                                        withPositionedModules(me);}}}),
                            ...(
                                typeof options.moduleSize === "number" ?
                                    Numbers.nCopies(options.moduleSize, 2) :
                                Objects.isNil(options.moduleSize) ?
                                    [defaults.moduleSize.width, defaults.moduleSize.height] :
                                    [options.moduleSize.width, options.moduleSize.height])),
                        padding= Module.of(
                            (horizontal, vertical) => Objects.withGettersAndSetters({}, {
                                horizontal: {
                                    get: () => horizontal,
                                    set: newHorizontal => {
                                        if(horizontal === newHorizontal) return;
                                        horizontal = newHorizontal;
                                        withPositionedModules(me);}},
                                vertical: {
                                    get: () => vertical,
                                    set: newVertical => {
                                        if(vertical === newVertical) return;
                                        vertical = newVertical;
                                        withPositionedModules(me);}}}),
                            ...(
                                typeof options.padding === "number" ?
                                    Numbers.nCopies(options.padding, 2) :
                                    Objects.isNil(options.padding) ?
                                        [defaults.padding.horizontal, defaults.padding.vertical] :
                                        [options.padding.horizontal, options.padding.vertical])),
                        columns= options.columns??defaults.columns,
                        alignment= Module.of(
                            (horizontal, vertical) => Objects.withGettersAndSetters({}, {
                                horizontal: {
                                    get: () => horizontal,
                                    set: newHorizontal => {
                                        if(horizontal === newHorizontal) return;
                                        horizontal = newHorizontal;
                                        withPositionedModules(me);}},
                                vertical: {
                                    get: () => vertical,
                                    set: newVertical => {
                                        if(vertical === newVertical) return;
                                        vertical = newVertical;
                                        withPositionedModules(me);}}}),
                            ...(Object.values(Objects.withDefaults(options.alignment??{}, defaults.alignment)))),
                        overflow= options.overflow??defaults.overflow,
                        me=withPositionedModules(Objects.withGettersAndSetters(
                            SVG.Builder(SVG.G())
                                .withClass("modular-grid")
                                .withChildren(...modules)
                                .build(),
                            {
                                modules: {
                                    get: () => modules,
                                    set: newModules => {
                                        modules.forEach(module => {
                                            if(module.parentNode === me) {
                                                me.removeChild(module);}});
                                        modules = newModules;
                                        withPositionedModules(me);
                                        SVG.withChildren(me, ...modules);}},
                                moduleSize: {
                                    get: () => moduleSize,
                                    set: newModuleSize => {
                                        if(typeof newModuleSize === "number") {
                                            moduleSize.width = newModuleSize;
                                            moduleSize.height = newModuleSize;}
                                        else {
                                            moduleSize.width = newModuleSize.width;
                                            moduleSize.height = newModuleSize.height;}}},
                                padding: {
                                    get: () => padding,
                                    set: newPadding => {
                                        if(typeof newPadding === "number") {
                                            padding.horizontal = newPadding;
                                            padding.vertical = newPadding;}
                                        else {
                                            padding.horizontal = newPadding.horizontal;
                                            padding.vertical = newPadding.vertical;}}},
                                columns: {
                                    get: () => columns,
                                    set: newColumns => {
                                        columns = newColumns;
                                        withPositionedModules(me);}},
                                alignment: {
                                    get: () => alignment},
                                overflow: {
                                    get: () => overflow,
                                    set: newOverflow => {
                                        overflow = newOverflow;
                                        withPositionedModules(me);}}}))
                    ) => me))
                    .withFields({
                        withModules: (modularGrid, ...modules) => {
                            modularGrid.modules = Arrays.distinct(modularGrid.modules.concat(modules));
                            return modularGrid;},
                        withoutModules: (modularGrid, ...modules) => {
                            modularGrid.modules = modularGrid.modules.filter(module => !modules.includes(module));},
                        setModules: (modularGrid, ...modules) => {
                            modularGrid.modules = modules;
                            return modularGrid;},
                        clear: modularGrid => SVG.Compositions.ModularGrid.setModules(modularGrid, [])})
                    .withBuilder({initializer: () => SVG.Compositions.ModularGrid()})
                    .withFields({
                        Alignment: Alignment,
                        Overflow: Overflow})
                    .withMethod("positions", modularGrid => {
                        const alignmentOffset=[
                            modularGrid.alignment.horizontal === Alignment.Horizontal.left ?
                                0 :
                            modularGrid.alignment.horizontal === Alignment.Horizontal.center ?
                                .5 * modularGrid.moduleSize.width :
                            modularGrid.alignment.horizontal === Alignment.Horizontal.right ?
                                modularGrid.moduleSize.width : undefined,
                            modularGrid.alignment.vertical === Alignment.Vertical.top ?
                                0 :
                            modularGrid.alignment.vertical === Alignment.Vertical.center ?
                                .5 * modularGrid.moduleSize.height :
                            modularGrid.alignment.vertical === Alignment.Vertical.bottom ?
                                modularGrid.moduleSize.height : undefined];
                        const fullRowXs=Numbers.range(0, modularGrid.columns)
                            .map(i=>alignmentOffset[0]+i*(modularGrid.moduleSize.width+modularGrid.padding.horizontal));
                        const numFullRows=Math.floor(modularGrid.modules.length/modularGrid.columns);
                        const columnYs=Numbers.range(0,Math.ceil(modularGrid.modules.length / modularGrid.columns))
                            .map(i=>alignmentOffset[1]+i*(modularGrid.moduleSize.height+modularGrid.padding.vertical));
                        const lastRowBlankColumns = modularGrid.columns - modularGrid.modules.length % modularGrid.columns;
                        const overflowX = modularGrid.overflow === Overflow.left ? 0 :
                            modularGrid.overflow === Overflow.center ? .5 * (
                                lastRowBlankColumns * modularGrid.moduleSize.width +
                                (lastRowBlankColumns - 2) * modularGrid.padding.horizontal) :
                                modularGrid.overflow === Overflow.right ? lastRowBlankColumns * (
                                    modularGrid.moduleSize.width + modularGrid.padding.horizontal) : undefined;
                        //Full row positions
                        return Numbers.range(0, numFullRows)
                            .map(row=>Numbers.range(0, modularGrid.columns)
                                .map(column=>[fullRowXs[column], columnYs[row]]))
                            .flat()
                            .concat(
                                //Unfull row positions
                                Numbers.range(numFullRows*modularGrid.columns, modularGrid.modules.length)
                                    .map((moduleIndex, column)=>[
                                        overflowX + column * (modularGrid.moduleSize.width + modularGrid.padding.horizontal),
                                        Arrays.last(columnYs)]));})
                    .build()),
                Modal: Module.of((
                    fillOpacity=.95,
                    contentPadding=10,
                    defaults = {
                        content: null,
                        width: null,
                        height: null,
                        closeListener: Functions.noop}
                ) => Objects.Builder((options={}) => {
                    options = Objects.withDefaults(options, defaults);
                    return Objects.withField(
                        SVG.Builder(SVG.G())
                            .withClass("modal")
                            .withChild(SVG.withAttributes(
                                SVG.Compositions.MouseRegion({
                                    width: Style.width,
                                    height: Style.height,
                                    listeners: {
                                        down: function() {
                                            SVG.Compositions.Modal.close(this.parentElement);}}}),
                                {
                                    fill: Style.colors.black,
                                    fillOpacity: fillOpacity}))
                            .withChild(SVG.Builder(SVG.G())
                                .moveTo(.5 * (Style.width - options.width), .5 * (Style.height - options.height))
                                .withChild(SVG.withFill(
                                    SVG.Rect({
                                        x: -contentPadding,
                                        y: -contentPadding,
                                        width: Objects.isNil(options.width) ?
                                            options.content.getBoundingClientRect().width :
                                            options.width + 2*contentPadding,
                                        height: Objects.isNil(options.height) ?
                                            options.content.getBoundingClientRect().height :
                                            options.height + 2*contentPadding}),
                                    Style.colors.white))
                                .withChild(options.content)
                                .build())
                            .build(),
                        "closeListener", options.closeListener);})
                .withFields({
                    withCloseListener: (modal, listener) => {
                        modal.closeListener = listener;
                        return modal;}})
                .withBuilder()
                .withFields({
                    close: modal => {
                        modal.parentElement.removeChild(modal);
                        modal.closeListener();}})
                .build()),
                /**
                 * Wrapper for MouseEvents -
                 *     underlying's an invisible SVG.Rect that may be positioned/sized;
                 *     'listener' field is an object with 'event type string'-'listener function' key/values.
                 *     Statically keeps track of elements that are being dragged and/or 'mouse over'ed,
                 *         passing this state to listeners.
                 *     A 'fixed' mouse position relative to the element is also passed to listeners.
                 *
                 * Event types include:
                 *     enter,
                 *     leave,
                 *     move,
                 *     down,
                 *     up   (any mouse-up after this element was mouse-down-ed)
                 *
                 * Listeners are passed object like: {
                 *     position: [2-length array] 'fixed' mouse position relative to element
                 *     isDragging: [boolean]
                 *     dragTarget: [svg element or null]
                 *     mouseOverTarget: [svg element or null]}
                 */
                MouseRegion: Module.of((
                    mouseDownTarget=null,
                    mouseOverTarget=null,
                    mouseState=(e, target)=>({
                        position: MouseEvents.relativeMousePosition(e, target),
                        isDragging: mouseDownTarget !== null,
                        dragTarget: mouseDownTarget,
                        mouseOverTarget: mouseOverTarget}),
                    globalMouseUpListener=e=>{
                        window.removeEventListener("mouseup", globalMouseUpListener);
                        mouseDownTarget.listeners.up(mouseState(e, mouseDownTarget));
                        mouseDownTarget = null;},
                    defaults = {
                        width: 10,
                        height: 10,
                        listeners: {}},
                    EventType=Objects.sameKeyValues(
                        "enter", "leave", "move", "down", "up", "mouseUp")
                ) => Objects.Builder((optionsArg={}) => Module.of((
                    options = Objects.withDefaults(optionsArg, defaults),
                    listeners = Objects.withFields( //Write given listeners over Functions.noop defaults
                        Object.fromEntries(Object.keys(EventType).map(key => [key, Functions.noop])),
                        options.listeners)
                    ) => SVG.Compositions.MouseRegion.enable(
                        Objects.Builder(
                            SVG.Builder(SVG.Rect({
                                x: options.x,
                                y: options.y,
                                width: options.width,
                                height: options.height}))
                                .withClass("mouse-region")
                                .withoutFill()
                                .withoutStroke()
                                .withEventListeners({
                                    mouseenter: function(e) {
                                        mouseOverTarget = this;
                                        listeners.enter(mouseState(e, this));},
                                    mouseleave: function(e) {
                                        if(this.isEnabled === false) {
                                            return;}  //mouseleave gets fired when pointer events are disabled
                                        mouseOverTarget = null;
                                        listeners.leave(mouseState(e, this));},
                                    mousemove: function(e) {
                                        listeners.move(mouseState(e, this));},
                                    mousedown: function(e) {
                                        mouseDownTarget = this;
                                        listeners.down(mouseState(e, this));
                                        window.addEventListener("mouseup", globalMouseUpListener);}})
                                .withModification(function(){
                                    Object.keys(options.listeners).forEach(listenerKey =>
                                        listeners[listenerKey] = listeners[listenerKey].bind(this));})
                                .build())
                            .withGetter("listeners", () => listeners)
                            .withField("isEnabled", true)
                            .build())))
                    .withFields({
                        withListener: (region, eventType, listener) => {
                            region.listeners[eventType] = listener.bind(this);
                            return region;},
                        withListeners: (region, listeners) => {
                            Object.entries(listeners).forEach(listenerEntry =>
                                SVG.Compositions.MouseRegion.withListener(region, listenerEntry[0], listenerEntry[1]));
                            return region;},
                        removeListener: (region, type) => {
                            region.listeners[type] = Functions.noop;
                            return region;},
                        removeListeners: (region, types) => {
                            types.forEach(type => SVG.Compositions.MouseRegion.removeListener(region, type));
                            return region;},
                        /**
                         * En/dis-able will not affect drag and mouseUp, as those events belong to the window.
                         */
                        enable: region => {
                            SVG.withCursor(region, "pointer");
                            SVG.withPointerEvents(region, SVG.Attributes.Presentation.PointerEvents.all);
                            region.isEnabled = true;
                            return region;},
                        disable: region => {
                            SVG.withCursor(region, "default");
                            region.isEnabled = false;
                            SVG.withoutPointerEvents(region);
                            return region;}})
                    .withBuilder()
                    .withFields({
                        EventType: EventType,
                        isEnabled: region => region.getAttribute("pointer-events") !== "none"})
                    .build()),
                NumberByDigitInput: Module.of((
                    defaults = {
                        initial: null,
                        enabled: true,
                        min: 0,
                        max: 100,
                        fontSize: 16,
                        changeListener: Functions.noop,
                        cellSize: 25,
                        labelMargin: 5}
                ) => Objects.Builder((optionsArg={}) =>
                    Module.of((
                        options=Objects.withDefaults(optionsArg, defaults),
                        selectionMarkerSize=options.cellSize / Numbers.goldenRatio,
                        changeListener = options.changeListener,
                        numDigits = x => x === 0 ? 1 : 1+Math.floor(Math.log10(x)),
                        digitLabels = () => Numbers.range(0, 10)
                            .map(i => SVG.Builder(SVG.Text(i))
                                .moveTo((.5+i) * options.cellSize, -options.labelMargin)
                                .centerAlign()
                                .topAlign()
                                .build()),
                        digitLabelContainer = SVG.Builder(SVG.G())
                            .withChildren(...digitLabels())
                            .build(),
                        cellGrid = Module.of((
                            indexToDigitValue=i=>[numDigits(options.max) - Math.floor(i/10) - 1, i%10],
                            digitValueToIndex=(digit,value)=>10*(numDigits(options.max)-digit-1)+value,
                            isDragging = false,
                            createCells=() => Numbers
                                .range(0, 10*numDigits(options.max), 1)
                                .map(i => Module.of((digitValue = indexToDigitValue(i)) => SVG.withAttributes(
                                    SVG.Compositions.MouseRegion({
                                        width: options.cellSize,
                                        height: options.cellSize,
                                        listeners: {
                                            enter: function() {
                                                if(isDragging === true) {
                                                    Selection.setDigit(...digitValue);}
                                                else {
                                                    Preview.set(...digitValue);}},
                                            down: () => {
                                                isDragging = true;
                                                Preview.unset();
                                                Selection.setDigit(...digitValue);},
                                            leave: () => {
                                                if(isDragging === false) {
                                                    Preview.unset();}},
                                            up: ()=> isDragging = false}}),
                                    {
                                        stroke: Style.colors.superHeavy,
                                        strokeWidth: 1})))
                        ) => Objects.withMethods(
                            SVG.Compositions.ModularGrid({
                                modules: createCells(),
                                columns: 10,
                                moduleSize: options.cellSize,
                                padding: 0}),
                            {
                                resetCells: function() {
                                    this.modules = createCells();},
                                preview: function(digit, value) {
                                    SVG.Builder(this.modules[digitValueToIndex(digit, value)])
                                        .withStrokeWidth(2)
                                        .withoutFill()
                                        .build();},
                                select: function(digit, value) {
                                    SVG.Builder(this.modules[digitValueToIndex(digit, value)])
                                        .withStrokeWidth(1)
                                        .withFill(Style.colors.superHeavy)
                                        .build();},
                                normal: function(digit, value) {
                                    SVG.Builder(this.modules[digitValueToIndex(digit, value)])
                                        .withStrokeWidth(1)
                                        .withoutFill()
                                        .build()},
                                enable: function(digit, value) {
                                    SVG.Compositions.MouseRegion.enable(
                                        SVG.withoutFill(this.modules[digitValueToIndex(digit, value)]));},
                                disable: function(digit, value) {
                                    SVG.Compositions.MouseRegion.disable(
                                        SVG.Builder(this.modules[digitValueToIndex(digit, value)])
                                            .withFill(Style.colors.light)
                                            .withStrokeWidth(1)
                                            .build());},
                                enableDisableAll: function() {
                                    if(options.enabled === false) {
                                        return Numbers.range(0, this.modules.length)
                                            .forEach(i=>this.disable(...indexToDigitValue(i)));}
                                    const digits = numDigits(options.max);
                                    const mins = [];
                                    const maxes = [];
                                    let differentFromMinFound = false;
                                    let differentFromMaxFound = false;
                                    Numbers.range(0, digits).forEach(i => {
                                        //Start assuming all values are enabled.
                                        let digitMin = 0;
                                        let digitMax = 9;
                                        if(differentFromMinFound === false) {
                                            //Since a value different from the min has yet to be found,
                                            //The minimum for this digit is identical to options.min.
                                            //Also, check if the *selected* value for this digit is different from
                                            //options.min.
                                            differentFromMinFound = Numbers.digitValue(Selection.get(), digits-i-1) !== (
                                                digitMin = Numbers.digitValue(options.min, digits-i-1));}
                                        if(differentFromMaxFound === false) {
                                            //Since a value different from the max has yet to be found,
                                            //The maximum for this digit is identical to options.max.
                                            //Also, check if the *selected* value for this digit is different from
                                            //options.max.
                                            differentFromMaxFound = Numbers.digitValue(
                                                Selection.get(),
                                                digits-i-1
                                            ) !== (
                                                digitMax = Numbers.digitValue(options.max, digits-i-1));}
                                        Arrays.insertFirst(mins, digitMin);
                                        Arrays.insertFirst(maxes, digitMax);});
                                    Numbers
                                        .range(0, digits)
                                        .forEach(digit=>{
                                            //Enable values for this digit
                                            Numbers
                                                .range(mins[digit], maxes[digit]+1)
                                                .forEach(value => this.enable(digit, value));
                                            //Disable values for this digit
                                            Numbers
                                                .range(0, mins[digit])
                                                .concat(Numbers.range(maxes[digit]+1, 10))
                                                .forEach(value => this.disable(digit, value));});}})),
                        Preview = Module.of((digit=null, value=null) => ({
                            set: (newDigit, newValue) => {
                                if(newDigit === digit && newValue === value) {
                                  return; }
                                const previewSelected = Numbers.digitValue(Selection.get(), newDigit) === newValue;
                                if(! (digit === null || previewSelected === true)) {
                                    cellGrid.normal(digit, value);}
                                if(newDigit === null || newValue === null || previewSelected === true) {
                                    digit = null;
                                    value = null;}
                                else {
                                    digit = newDigit;
                                    value = newValue;
                                    cellGrid.preview(digit, value);}},
                            unset: () => Preview.set(null, null)})),
                        Selection = Module.of((
                            selectedNumber = null,
                            fullRender = () => {
                                SVG.withChildren(SVG.clearChildren(digitLabelContainer), ...digitLabels());
                                cellGrid.resetCells();
                                cellGrid.enableDisableAll();
                                if(selectedNumber !== null && options.enabled === true) {
                                    Numbers.range(0, numDigits(options.max))
                                        .map(digit=>Numbers.digitValue(selectedNumber, digit))
                                        .forEach((value, digit)=> cellGrid.select(digit, value));}}
                        ) => ({
                            get: () => selectedNumber,
                            setDigit: (digit, value) => {
                                let newNumber = Numbers.toDigitArray(selectedNumber);
                                newNumber = Numbers.fromDigitArray(Arrays.replaceItem(
                                    newNumber.concat(Numbers.nCopies(0, numDigits(options.max)-newNumber.length)),
                                    digit,
                                    value));
                                Selection.set(newNumber);},
                            set: number => {
                                number = Numbers.clamp(number, options.min, options.max);
                                if(number !== selectedNumber && number >= options.min && number <= options.max) {
                                    selectedNumber = number;
                                    fullRender();
                                    changeListener(selectedNumber);}},
                            rerender: fullRender})),
                        initialize=Selection.set(options.initial??options.min)
                    ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                            .withClass("number-by-digit-input")
                            .withChildren(digitLabelContainer, cellGrid)
                            .withFontSize(options.fontSize)
                            .build())
                        .withGettersAndSetters({
                            changeListener: {
                                get: () => changeListener,
                                set: f => changeListener = f },
                            enabled: {
                                get: () => options.enabled,
                                set: enabled => {
                                    if(enabled === options.enabled) return;
                                    options.enabled = enabled;
                                    cellGrid.enableDisableAll();
                                    Selection.rerender();}},
                            value: {
                                get: () => Selection.get(),
                                set: Selection.set},
                            min: {
                                get: () => options.min,
                                set: min => {
                                    if(min === options.min || min > options.max) return;
                                    options.min = min;
                                    Selection.get() < options.min ?
                                        Selection.set(options.min) :
                                        Selection.rerender();}},
                            max: {
                                get: () => options.max,
                                set: max => {
                                    if(max === options.max || max < options.min) return;
                                    options.max = max;
                                    Selection.get() > options.max ?
                                        Selection.set(options.max) :
                                        Selection.rerender();}},
                            cellGrid: {
                                get: () => cellGrid}})
                        .build()))
                    .withFields({
                        withChangeListener: (input, listener) => {
                            input.changeListener = listener;
                            return input;},
                        withValue: (input, value) => {
                            input.value = value;
                            return input;},
                        withMin: (input, min) => {
                            input.min = min;
                            return input;},
                        withMax: (input, max) => {
                            input.max = max;
                            return input;},
                        enable: input => {
                            input.enabled = true;
                            return input;},
                        disable: input => {
                            input.enabled = false;
                            return input;}})
                    .withBuilder()
                    .build()),
                /**
                 * A simple Rect button with text.
                 *
                 * Exposes a clickListener
                 */
                TextButton: Module.of((
                    defaults = {
                        width: 300,
                        height: 100,
                        text: "do",
                        clickListener: Functions.noop}
                ) => Objects.Builder((optionsArg={}) =>
                    Module.of((
                        options = Objects.withDefaults(optionsArg, defaults),
                        label=SVG.Builder(SVG.Text(options.text))
                            .withClass("text-button-label")
                            .moveTo(.5*options.width, .5*options.height)
                            .centerAlignBoth()
                            .withFontSize(17)
                            .build(),
                        rect=SVG.withClass(
                            SVG.Rect(Objects.withOnlyFields(options, "width", "height")),
                            "text-button-outline"),
                        mouseRegion=SVG.Compositions.MouseRegion({
                            width: options.width,
                            height: options.height,
                            listeners: {
                                enter: function(e) {
                                    e.dragTarget === this ?
                                        SVG.Compositions.TextButton.active(this.parentElement) :
                                        SVG.Compositions.TextButton.preview(this.parentElement);},
                                down: function() {
                                    SVG.Compositions.TextButton.active(this.parentElement);},
                                leave: function() {
                                    SVG.Compositions.TextButton.normal(this.parentElement);},
                                up: function(e) {
                                    SVG.Compositions.TextButton.normal(this.parentElement);
                                    if(e.mouseOverTarget === this) {
                                        SVG.Compositions.TextButton.preview(this.parentElement);
                                        this.parentElement.clickListener();}}}})
                    ) => SVG.Compositions.TextButton.enable(
                        Objects.Builder(SVG.Builder(SVG.G())
                            .withClass("text-button")
                            .withChildren(label, rect, mouseRegion)
                            .build())
                        .withGetters({
                            label: () => label,
                            rect: () => rect,
                            mouseRegion: () => mouseRegion})
                        .withGettersAndSetters({
                            text: {
                                get: () => options.text,
                                set: value=> {
                                    options.text = value;
                                    label.textContent = value;}},
                            width: {
                                get: ()=> options.width,
                                set: value=> {
                                    options.width = value;
                                    SVG.xTo(label, .5*value);
                                    mouseRegion.width = value;
                                    rect.width = value;}},
                            height: {
                                get: ()=> options.height,
                                set: value=> {
                                    options.height= value;
                                    SVG.yTo(label, .5*value);
                                    mouseRegion.height = value;
                                    rect.height = value;}},
                            clickListener: {
                                get: ()=> options.clickListener,
                                set: value=> options.clickListener = value}})
                        .build())))
                    .withFields({
                        enable: textButton => SVG.Builder(textButton)
                            .withCursor(SVG.Attributes.Presentation.Cursor.pointer)
                            .withPointerEvents("none")
                            .withModification(function(){
                                SVG.withTextDecoration(this.label, "none");
                                SVG.Compositions.MouseRegion.enable(this.mouseRegion);})
                            .build(),
                        disable: textButton => SVG.Builder(textButton)
                            .withCursor("not-allowed")
                            .withPointerEvents("fill")
                            .withModification(function(){
                                SVG.withTextDecoration(this.label, "line-through");
                                SVG.Compositions.MouseRegion.disable(this.mouseRegion);})
                            .build(),
                        resize: (textButton, width, height) => {
                            textButton.width = width;
                            textButton.height = height;
                            return textButton;},
                        normal: textButton=>SVG.withStrokeWidth(textButton, 1),
                        preview: textButton=>SVG.withStrokeWidth(textButton, 1.5),
                        active: textButton=>SVG.withStrokeWidth(textButton, 2)})
                    .withSimpleBuilderSetters("text", "width", "height", "clickListener")
                    .withBuilder()
                    .build())}))})
        .build());

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
    //Shape are defined with a fret range ∈ {(a,b)|1<=a<=b<=11}
    //
    //A chord is a shape with a fixed root fret.
    const Shape = Module.of((
        StringAction = Objects.withFields(()=>StringAction.any, {
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
            fromString: string =>
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
            toString: stringAction =>
                [StringAction.unsounded, StringAction.open, StringAction.any].includes(stringAction) ?
                    stringAction :
                    stringAction.sounded ?
                        `${stringAction.fret}${stringAction.finger}` :
                        `x${stringAction.fret}${stringAction.finger}`,
            isFingered: stringAction => ! StringAction.isFingerless(stringAction),
            isFingerless: stringAction => [
                StringAction.any,
                StringAction.unsounded,
                StringAction.open
            ].includes(stringAction),
            equals: (a, b) => StringAction.toString(a) === StringAction.toString(b),
            isDeadened: stringAction => StringAction.isFingered(stringAction) && ! stringAction.sounded,
            matches: (stringAction, search) =>
                search === StringAction.any ||
                StringAction.equals(stringAction, search) || (
                StringAction.isFingered(search) &&
                search.finger === Fingers.any &&
                StringAction.isFingered(stringAction) &&
                stringAction.sounded === search.sounded &&
                stringAction.fret === search.fret)}),
        FingerAction=Objects
            .Builder(Module.of((
                defaultFingerAction= {
                    finger: Fingers.any,
                    fret: Frets.roots.first,
                    range: Strings.range(Strings.first, Strings.first)}
            ) => fingerAction => Objects.withDefaults(fingerAction, defaultFingerAction)))
            .withFields({
                withFinger: (fingerAction, finger) => Objects.withField(fingerAction, "finger", finger),
                withFret: (fingerAction, fret) => Objects.withField(fingerAction, "fret", fret),
                withRange: (fingerAction, range) => Objects.withField(fingerAction, "range", range),
                withStartString: (fingerAction, startString) => {
                    fingerAction.range.min = startString;
                    return fingerAction;},
                withEndString: (fingerAction, endString) => {
                    fingerAction.range.max = endString
                    return fingerAction;}})
            .withBuilder()
            .build(),
        Schema = Objects.withFields(()=>Schema.allUnsounded, {
            allUnsounded: () => Numbers.range(0, Strings.count).map(() => StringAction.unsounded),
            allAnyStringAction: () => Numbers.range(0, Strings.count).map(() => StringAction.any),
            fromString: string => string.split(",").map(StringAction.fromString),
            toString: schema => schema.map(StringAction.toString).join(","),
            getFingerActions: schema => schema
                .map((action, index) => ({
                    string: index + 1,
                    action: Shape.StringAction.isFingerless(action) ||
                    action === Shape.StringAction.any ? null : action}))
                .filter(stringAction => stringAction.action !== null)
                .reduce(Module.of(
                    ((stringActionToFingerAction = stringAction => FingerAction({
                        finger: stringAction.action.finger,
                        fret: stringAction.action.fret,
                        range: Strings.range(stringAction.string, stringAction.string)})
                    ) => (fingerActions, stringAction) => fingerActions.length === 0 ?
                        [stringActionToFingerAction(stringAction)] :
                        Module.of((lastRelevantStringAction = Arrays.findLast(
                            schema.slice(0, stringAction.string - 1),
                            candidate => Shape.StringAction.isFingerless(candidate) ||
                                candidate.fret <= stringAction.action.fret)) =>
                            lastRelevantStringAction === undefined ||
                            Shape.StringAction.isFingerless(lastRelevantStringAction) ||
                            lastRelevantStringAction.finger !== stringAction.action.finger ||
                            lastRelevantStringAction.finger === Fingers.any
                                ?
                                fingerActions.concat(stringActionToFingerAction(stringAction)) :
                                Arrays.updateItem(
                                    fingerActions,
                                    Arrays.lastIndexOf(fingerActions,
                                        fingerAction => fingerAction.finger === stringAction.action.finger),
                                    fingerAction => fingerAction.range.max = stringAction.string)))),
                    []),
            equals: (a, b) => Schema.toString(a) === Schema.toString(b)}),
        clickTempElement = element => {
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);},
        shapesFromString = string => string.length === 0 ? [] :
            string.split(/\r?\n/).map((line, lineIndex) => Module.of((
                lineProperties = line.split(";")
            ) => ({
                id: lineIndex,
                schema: Schema.fromString(lineProperties[0]),
                range: Module.of((
                    rangeComponents = lineProperties[1].split(",")
                ) => Frets.Range(
                    Number.parseInt(rangeComponents[0]),
                    Number.parseInt(rangeComponents[1])))}))),
        shapesToString = shapes => shapes.length === 0 ? "" : shapes
            .map(shape =>`${Schema.toString(shape.schema)};${shape.range.min},${shape.range.max}`)
            .join("\r\n"),
        localStorageKey = "chord-jog-shapes",
        shapesLibraryUrl = "https://raw.githubusercontent.com/Beumuth/chord-jog/0.3.0/library.shapes",
        saveToLocalStorage = () => localStorage.setItem(
            localStorageKey,
            shapesToString(Shape.all)),
        replaceAll = shapes => {
            Shape.all.length = 0;
            Shape.all.push(...shapes);
            saveToLocalStorage();}
    )=> Objects
        .Builder(()=>({
            id: null,
            schema: Schema.allUnsounded,
            range: Frets.Range.roots}))
        .withFields({
            withId: (shape, id) => Objects.withField(shape, "id", id),
            withSchema: (shape, schema) => Objects.withField(shape, "schema", schema),
            withRange: (shape, range) => Objects.withField(shape, "range", range)})
        .withBuilder()
        .withFields({
            StringAction: StringAction,
            FingerAction: FingerAction,
            Schema: Schema,
            all: Module.of(() => {
                const shapesString = localStorage.getItem(localStorageKey);
                return shapesString !== null && shapesString.length > 0 ? shapesFromString(shapesString) : [];}),
            downloadStandardLibrary: () => fetch(shapesLibraryUrl)
                .then(response => response.ok ? response.text() : "")
                .catch(Functions.constant(""))
                .then(string=> shapesFromString(string)),
            existsWithSchema: schema => Shape.all.some(shape =>
                Schema.equals(shape.schema, schema)),
            getWithSchema: schema => Shape.all.find(shape => Schema.equals(shape.schema, schema)),
            add: shape => {
                shape.id = Shape.all.length;
                Shape.all.push(shape);
                saveToLocalStorage();},
            update: shape => {
                Shape.all[shape.id] = shape;
                saveToLocalStorage();},
            delete: id => {
                Shape.all.splice(id, 1);
                Numbers.range(id, Shape.all.length).forEach(i => Shape.all[i].id--);
                saveToLocalStorage();},
            search: schemaQuery => Shape.all.filter(shape =>undefined === shape.schema.find((stringAction, index) =>
                Module.of((
                    stringActionQuery=schemaQuery[index]
                ) => ! StringAction.matches(stringAction, stringActionQuery)))),
            replaceAll: replaceAll,
            download: () => {
                //Convert the shapes to a text string and open in a new tab
                const tempLink = document.createElement('a');
                tempLink.setAttribute(
                    'href',
                    'data:text/plain;charset=utf-8,' +
                    encodeURIComponent(shapesToString(Shape.all)));
                tempLink.setAttribute('download', "library.shapes");
                clickTempElement(tempLink);},
            upload: Module.of((
                mergeShapeLists = Module.of((
                    equals=(a, b) =>Schema.equals(a.schema, b.schema) && Frets.Range.equals(a.range, b.range)
                ) => (a, b) => a.concat(//Merge a with
                    //Items from b that are not in a
                    b.filter(bShape => undefined===a.find(aShape => equals(aShape, bShape)))))
            ) => (uploadCompleteListener, overwrite=false) => {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = ".shapes";
                fileInput.multiple = true;
                fileInput.onchange = () => Module.of((
                    files=fileInput.files,
                    numLoaded=0,
                    shapes=[],
                    fileReader = new FileReader(),
                    readNext=()=>fileReader.readAsText(files[numLoaded])
                ) => {
                    fileReader.addEventListener('loadend', e => {
                        shapes = mergeShapeLists(shapes, shapesFromString(e.target.result));
                        if(++numLoaded===files.length) {
                            if(overwrite !== true) {
                                shapes = mergeShapeLists(Shape.all, shapes);}
                            replaceAll(shapes);
                            uploadCompleteListener();}
                        else {
                            readNext();}});
                    readNext();});
                clickTempElement(fileInput);})})
        .build());

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
                anyStringAction = center => SVG.Builder(SVG.Text("*"))
                    .withClass("any-action-indicator")
                    .centerAlignBoth()
                    .withFontFamily("Courier New")
                    .withFontSize(14)
                    .moveTo(center[0], center[1] + 2)
                    .build(),
                deadString = center => SVG.withClass(
                    SVG.Path(
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
                            ${FingerlessIndicatorStyle.diameter * halfRoot2}`),
                    "dead-string-indicator"),
                openString = center => SVG.withClass(
                    SVG.Circle(center, FingerlessIndicatorStyle.radius),
                    "open-string-indicator"),
                maxActiveRelativeFretToCenterBottomY=maxActiveRelativeFret=>
                    Fretboard.fretToYCoordinate(
                        (maxActiveRelativeFret === undefined ? 0 : maxActiveRelativeFret) + .5) +
                    FingerlessIndicatorStyle.radius + FingerlessIndicatorStyle.margin
            ) => ({
                forString: string => Module.of((
                    centerX = FingerlessIndicatorStyle.startX + ((string - 1) * Fretboard.Style.stringSpacing),
                    centerTop = [
                        centerX,
                        FingerlessIndicatorStyle.startY + FingerlessIndicatorStyle.radius]
                ) => ({
                    topOnly: {
                        any: () => anyStringAction(centerTop),
                        dead: () => deadString(centerTop),
                        open: () => openString(centerTop)},
                    topAndBottom: ({
                        withMaxActiveRelativeFret: maxActiveRelativeFret => Module.of((
                            centerBottom = [
                                centerX,
                                maxActiveRelativeFretToCenterBottomY(maxActiveRelativeFret)]
                        ) => ({
                            any: () => SVG.Builder(SVG.G())
                                .withClass("any-string-indicators")
                                .withChildren(anyStringAction(centerTop), anyStringAction(centerBottom))
                                .build(),
                            dead: () => SVG.Builder(SVG.G())
                                .withClass("dead-string-indicators")
                                .withChildren(deadString(centerTop),deadString(centerBottom))
                                .build(),
                            open: () => SVG.Builder(SVG.G())
                                .withClass("open-string-indicators")
                                .withChildren(openString(centerTop), openString(centerBottom))
                                .build()}))}),
                    bottomOnly: ({
                        withMaxActiveRelativeFret: maxActiveRelativeFret => Module.of((
                            centerBottom = [
                                centerX,
                                maxActiveRelativeFretToCenterBottomY(maxActiveRelativeFret)]
                        ) => ({
                            any: () => anyStringAction(centerBottom),
                            dead: () => deadString(centerBottom),
                            open: () => openString(centerBottom)}))})}))}))}));

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
            Style: Module.of((
                stringSpacing=25,
                fretHeight = 29.5
            ) => ({
                stringSpacing: stringSpacing,
                fretHeight: fretHeight,
                startX: ShapeChartStyle.padding.x,
                startY: FingerlessIndicator.Style.startY +
                    FingerlessIndicator.Style.diameter +
                    FingerlessIndicator.Style.margin,
                width: stringSpacing * (Strings.count - 1),
                height: fretHeight * Frets.Relative.count})),
            stringToXCoordinate: (string) => Fretboard.Style.startX + (string - 1) * Fretboard.Style.stringSpacing,
            fretToYCoordinate: (fret) => Fretboard.Style.startY + (fret -.5) * Fretboard.Style.fretHeight,
            stringFretToXY: (string, fret) => [
                Fretboard.stringToXCoordinate(string),
                Fretboard.fretToYCoordinate(fret)],
            StringLineBuilder:  {
                forString: string => ({
                toFret: fret => SVG.Builder(
                    SVG.Line(
                        Fretboard.stringFretToXY(string, Frets.Relative.first - .5),
                        Fretboard.stringFretToXY(string, fret + .5)))
                    .withClass("string-line")
                    .withDataAttribute("string", string)
                    .build()})},
            FretDividerBuilder: {
                belowFret: (belowFret = Frets.Relative.last + 1) => ({
                fromString: fromString => ({
                toString: toString => SVG.Builder(
                    SVG.Line(
                        Fretboard.stringFretToXY(fromString, belowFret - .5),
                        Fretboard.stringFretToXY(toString, belowFret - .5)))
                    .withClass("fret-separator")
                    .withDataAttributes({
                        aboveFret: belowFret - 1,
                        belowFret: belowFret})
                    .build()})})}};

        FingerIndicator.Builder = {
            forFingerAction: fingerAction => Module.of((
                startX=Fretboard.stringToXCoordinate(fingerAction.range.min),
                width=Fretboard.stringToXCoordinate(fingerAction.range.max) - startX
            ) => SVG.Builder(SVG.G())
                .withClass("finger-indicator")
                .withDataAttributes({
                    finger: fingerAction.finger,
                    fret: fingerAction.fret,
                    minString: fingerAction.range.min,
                    maxString: fingerAction.range.max})
                .withAttribute("stroke", Style.colors.superHeavy)
                .moveTo(startX + .5 * width, Fretboard.fretToYCoordinate(fingerAction.fret))
                .withChild(SVG.Builder(
                    SVG.Rect.withRadius(
                        SVG.Rect({
                            x: -(.5*width + FingerIndicator.Style.radius),
                            y: -FingerIndicator.Style.radius,
                            width: FingerIndicator.Style.diameter + width,
                            height: FingerIndicator.Style.diameter}),
                        FingerIndicator.Style.radius))
                    .withClass("finger-indicator-outline")
                    .withFill(Style.colors.superHeavy)
                    .build())
                .withChild(SVG.Builder(SVG.Text(fingerAction.finger))
                    .centerAlignBoth()
                    .withAttributes({
                        fontFamily: FingerIndicator.Style.font,
                        stroke: "none",
                        fill: Style.colors.superLight,
                        fontSize: 17})
                    .move(0, fingerAction.finger !== Fingers.any ? 1.25 : 5)
                    .build())
                .build())};

        RootFretLabel.Style.x = Fretboard.stringToXCoordinate(1) -
            FingerIndicator.Style.radius -
            RootFretLabel.Style.paddingRight;
        RootFretLabel.Style.y = Fretboard.fretToYCoordinate(Frets.Relative.first);
        RootFretLabel.Builder = Module.of(() => {
            const rootFretToLabel = rootFret =>
                rootFret === undefined ? "" :
                rootFret === null ? "r" : rootFret;
            const forRootFret = rootFret => {
                const text = rootFretToLabel(rootFret);
                const label = Objects.withSetter(
                    SVG.Builder(
                        SVG.Text.Builder(SVG.Text(text))
                            .withTextLength(RootFretLabel.Style.textLength)
                            .withLengthAdjust("spacing")
                            .build())
                        .withClass("root-fret-label")
                        .moveTo(RootFretLabel.Style.x, RootFretLabel.Style.y)
                        .centerAlignVertical()
                        .rightAlign()
                        .withFontFamily(RootFretLabel.Style.fontFamily)
                        .withFontSize(RootFretLabel.Style.fontSize)
                        .build(),
                    "rootFret",
                    function(rootFret) {
                        SVG.Text.withTextContent(this, rootFretToLabel(rootFret));});
                return text.length <= 1 ? label : SVG.Text.withTextLength(label, 17); };
            return {
                fixed: fret => forRootFret(fret),
                unfixed: () => forRootFret(null)}; });

        //The 'skeleton' consists of the passive portion of the ShapeChart -
        //fretboard and finger indicator placeholders.
        const SkeletonBuilder = {
            new: () => Module.of((
                unfingeredIndicators = SVG.Builder(SVG.G())
                    .withClass("unfingered-indicators")
                    .withAttribute("stroke", Style.colors.medium)
                    .withChildren(...Strings.all
                        .map(string => FingerlessIndicator.Builder.forString(string).topOnly)
                        .map(fingerIndicatorBuilder => [
                            fingerIndicatorBuilder.open(),
                            fingerIndicatorBuilder.dead()])
                        .flat())
                    .build(),
                anyStringActionIndicators=Strings.all.map(string => FingerlessIndicator.Builder
                    .forString(string)
                    .bottomOnly
                    .withMaxActiveRelativeFret(Frets.Relative.last)
                    .any()),
                skeleton=SVG.Builder(SVG.G())
                    .withClass("shape-chart-skeleton")
                    .withChild(SVG.Builder(SVG.G())
                        .withClass("fretboard")
                        .withAttribute("stroke", Style.colors.heavy)
                        .withChildren(...Strings.all.map(string => Fretboard.StringLineBuilder
                            .forString(string)
                            .toFret(Frets.Relative.last)))
                        .withChildren(...Numbers.range(Frets.Relative.first, Frets.Relative.last + 2)
                            .map(belowFret => Fretboard.FretDividerBuilder
                                .belowFret(belowFret)
                                .fromString(Strings.first)
                                .toString(Strings.last)))
                        .build())
                    .build(),
                previewParam=Param.new(false).withObserver(withPreview => withPreview === true ?
                    SVG.withChild(skeleton, unfingeredIndicators) :
                    SVG.withoutChild(skeleton, unfingeredIndicators)),
                anyStringActionParam=Param.new(false).withObserver(withAnyStringAction => withAnyStringAction === true ?
                    SVG.withChildren(unfingeredIndicators, ...anyStringActionIndicators) :
                    SVG.withoutChildren(unfingeredIndicators, ...anyStringActionIndicators))
            ) => Objects.withParams(skeleton, {
                preview: previewParam,
                anyStringAction: anyStringActionParam}))};

        //The 'meat' consists of the active portion of the ShapeChart -
        // darkened fretboard strings and finger indicators.
        const MeatBuilder = {
            forSchema: schema => {
                const fingeredStringActions = schema.filter(Shape.StringAction.isFingered);
                const nonUnsoundedStringActions = schema
                    .map((action, index) => ({
                        string: index + 1,
                        action: action}))
                    .filter(stringAction => stringAction.action !== Shape.StringAction.unsounded);
                const anyStringActions = nonUnsoundedStringActions.filter(stringAction =>
                    stringAction.action === Shape.StringAction.any);
                const maxFret = anyStringActions.length > 0 ?
                    Frets.Relative.last :
                    fingeredStringActions.length === 0 ?
                        undefined :
                        fingeredStringActions
                            .map(stringAction => stringAction.fret)
                            .reduce((a, b) => a >= b ? a : b);
                const meat = SVG.Builder(SVG.G())
                    .G()
                    .withAttributes({
                        stroke: Style.colors.superHeavy,
                        strokeWidth: 1.25})
                    .withClass("shape-chart-meat")
                    .build();
                if(maxFret !== undefined) {SVG.Builder(meat)
                    //Active strings
                    .withChildren(...nonUnsoundedStringActions
                        .map(stringAction => SVG.withStrokeWidth(
                            Fretboard.StringLineBuilder
                                .forString(stringAction.string)
                                .toFret(maxFret),
                            1.5)))
                    //Active frets dividers
                    .withChildren(...Numbers.range(Frets.Relative.first, maxFret + 2).map(belowFret =>
                        SVG.withStrokeWidth(
                            Fretboard.FretDividerBuilder
                                .belowFret(belowFret)
                                .fromString(nonUnsoundedStringActions[0].string)
                                .toString(nonUnsoundedStringActions[nonUnsoundedStringActions.length-1].string),
                            1.5)))
                    .build()}
                return nonUnsoundedStringActions.length === 0 ? meat : SVG.Builder(meat)
                    //Any string action indicators
                    .withChildren(...anyStringActions.map(stringAction => SVG.withStroke(
                        FingerlessIndicator.Builder
                            .forString(stringAction.string)
                            .bottomOnly
                            .withMaxActiveRelativeFret(maxFret)
                            .any(),
                        Style.colors.black)))
                    //Open strings indicators
                    .withChildren(...nonUnsoundedStringActions
                        .filter(stringAction => stringAction.action === Shape.StringAction.open)
                        .map(stringAction => SVG.withStroke(
                            FingerlessIndicator.Builder
                                .forString(stringAction.string)
                                .topAndBottom
                                .withMaxActiveRelativeFret(maxFret)
                                .open(),
                            Style.colors.black)))
                    //Dead strings indicators
                    .withChildren(...nonUnsoundedStringActions
                        .filter(stringAction => Shape.StringAction.isDeadened(stringAction.action))
                        .map(stringAction => stringAction.string)
                        .map(deadString => SVG.withStroke(
                            FingerlessIndicator.Builder
                                .forString(deadString)
                                .topAndBottom
                                .withMaxActiveRelativeFret(maxFret)
                                .dead(),
                            Style.colors.black)))
                    //Finger indicators
                    .withChildren(...Shape.Schema.getFingerActions(schema)
                        .map(fingerAction => FingerIndicator.Builder.forFingerAction(fingerAction)))
                    .build()}};
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
            RootFretLabel: {
                Style: RootFretLabel.Style},
            Builder: Module.of((
                buildStep = (schema, rootFret) => Module.of((
                    shapeChartMeat = MeatBuilder.forSchema(schema),
                    rootFretLabel = rootFret === null ?
                        RootFretLabel.Builder.unfixed() :
                        RootFretLabel.Builder.fixed(rootFret),
                    Schema = Module.of((value=schema) => ({
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
                            rootFretLabel.rootFret = value;}})),
                    skeleton=SkeletonBuilder.new()
                ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                        .withClass("shape-chart")
                        .withChildren(skeleton, shapeChartMeat, rootFretLabel)
                        .build())
                    .withMethods({
                        withSchema: function(schema) {
                            this.schema = schema;
                            return this;},
                        withRootFret: function(rootFret) {
                            this.rootFret = rootFret;
                            return this;}})
                    .withGettersAndSetters({
                        meat: {
                            get: () => shapeChartMeat},
                        rootFretLabel: {
                            get: () => rootFretLabel},
                        skeleton: {
                            get: () => skeleton},
                        schema: {
                            get: Schema.get,
                            set: Schema.set},
                        rootFret: {
                            get: RootFret.get,
                            set: RootFret.set}})
                    .build()),
                rootFretStep = schema => ({
                    fixed: rootFret => buildStep(schema, rootFret),
                    unfixed: () => buildStep(schema, null)})
            ) => ({
                blank: () => rootFretStep(Shape.Schema.allUnsounded()),
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
                        withValue: value => ({
                        withPosition: position => ({
                        withTextOffset: textOffset => Module.of((region={
                            value: value,
                            position: position,
                            textOffset: textOffset}
                        ) => ({
                            withPointModel: p => {
                                region.joints = [p];
                                return region;},
                            withLineSegmentModel: lineSegment => {
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
                    forStaticRegion: staticRegion => SVG.Builder(SVG.Text(staticRegion.value))
                        .withClass("finger-label")
                        .withAttributes({
                            x: staticRegion.position[0],
                            y: staticRegion.position[1],
                            fontFamily: "Courier New",
                            fontSize: 37,
                            dx: -10.5 + staticRegion.textOffset[0],
                            dy: 10.5 + staticRegion.textOffset[1]})
                        .build()},
                RegionJointsBuilder = Module.of((
                    pointToJoint = point => Objects.withGetter(
                        SVG.Builder(SVG.Circle(point, 1))
                            .withClass("finger-input-region-joint")
                            .hide()
                            .build(),
                        "position",
                        () => point)
                ) => ({
                    forStaticRegion: staticRegion => staticRegion.joints.map(pointToJoint)})),
                RegionBuilder={
                    forStaticRegion: staticRegion =>  Module.of((
                        joints = RegionJointsBuilder.forStaticRegion(staticRegion)
                    ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                            .withClass("finger-region")
                            .withChild(RegionLabelBuilder.forStaticRegion(staticRegion))
                            .withChild(SVG.Builder(SVG.G())
                                .withClass("finger-region-joints")
                                .withChildren(...joints)
                                .build())
                            .build())
                        .withGetters({
                            value: () => staticRegion.value,
                            position: () => staticRegion.position})
                        .withMethod("distance2", joints.length === 1 ?
                            p => Geometry.distance2(p, joints[0].position) :
                            p => Geometry.distance2(p,
                                Geometry.projectPointOnLineSegment(p,
                                    joints.map(joint => joint.position))))
                        .build())},
                RegionsBuilder = {
                    forStaticRegions: staticRegions => staticRegions.map(RegionBuilder.forStaticRegion)}
            ) => ({
                fingers: () => RegionsBuilder.forStaticRegions(StaticRegions.fingers),
                all: () => RegionsBuilder.forStaticRegions(StaticRegions.all)})),
            FingerInputBuilder = Module.of((
                RegionIndicatorBuilder = Module.of((
                    radius=18,
                    previewStrokeDasharray="4 5",
                    createIndicator = () => Module.of((region=null) => Objects.Builder(SVG.Circle([0,0], radius))
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
                                   SVG.Circle.withCenter(this, newRegion.position);
                                    //Is the old region nothing?
                                    if(region === null) {
                                        //Yes. Show the indicator.
                                        SVG.show(this);}}
                                    //The new region is nothing.
                                //Is the old region something?
                                else if(region !== null) {
                                    //Yes. Hide the indicator.
                                    SVG.hide(this);}
                                //Finally, update the region.
                                region = newRegion;})
                        .withMethod("forRegion", function(region) {
                            this.region = region;
                            return this;})
                        .build())
                ) => ({
                    selected: {
                        withInitialRegion: initialRegion => createIndicator()
                            .forRegion(initialRegion)},
                    preview: () => SVG.Builder(createIndicator())
                        .withAttribute("stroke-dasharray", previewStrokeDasharray)
                        .hide()
                        .build()}))
            ) => ({
                withRegions: regions => Module.of((
                    regionByValue=(value) => regions.find(region => region.value === value),
                    positionToClosestRegionValue = mousePosition => regions
                        .map(region => ({
                            value: region.value,
                            distance2: region.distance2(mousePosition)}))
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
                                null}
                    ) => Objects.Builder(
                        SVG.Builder(SVG.G())
                            .withClass("finger-input")
                            .withChild(SVG.Builder(
                                SVG.Path( //hand-outline
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
                                    z`.replace(/\s+/g, " ")))
                                .withClass("hand-outline")
                                .build())
                            .withChild(SVG.Builder(SVG.G())
                                .withClass("finger-regions")
                                .withChildren(...regions)
                                .build())
                            .withChild(selectedIndicator)
                            .withChild(previewIndicator)
                            .withChild(Module.of((
                                scalePosition=position=>Vector.multiply(position, 1/FingerInputStyle.scale)
                            ) => SVG.Builder(
                                SVG.Compositions.MouseRegion({
                                    width: FingerInputStyle.baseWidth,
                                    height: FingerInputStyle.baseHeight,
                                    listeners: {
                                        move: e => Preview.set(positionToClosestRegionValue(scalePosition(e.position))),
                                        down: e => Selected.set(positionToClosestRegionValue(scalePosition(e.position))),
                                        leave: () => Preview.set(null)}}))
                                .withClass("finger-input-mouse-region")
                                .build()))
                            .scale(FingerInputStyle.scale)
                            .withStrokeWidth(FingerInputStyle.strokeWidth)
                            .build())
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
                        .build())})}))}))
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
            MouseRegionsBuilder = Module.of((
                MouseXToClosestStringMapperBuilder = {
                    withLeftPadding: leftPadding => mouseX => Strings.all
                        .map(string => ({
                            string: string,
                            distanceXToMouse: Math.abs(
                                mouseX -
                                leftPadding -
                                ShapeChart.Fretboard.Style.stringSpacing * (string - 1))}))
                        .reduce((a, b) => a.distanceXToMouse <= b.distanceXToMouse ? a : b)
                        .string },
                FingerlessIndicators = Module.of((
                    horizontalPadding=ShapeChart.FingerIndicator.Style.radius,
                    mouseXToClosestString=MouseXToClosestStringMapperBuilder
                        .withLeftPadding(horizontalPadding + ShapeChart.FingerlessIndicator.Style.radius)
                ) => ({
                    Style: {
                        padding: {
                            horizontal: horizontalPadding,
                            vertical: 7}},
                    mouseRegionStateToSchemaChange: state=>Module.of((
                        targetString = mouseXToClosestString(state.mousePosition[0]),
                        schema = Arrays.replaceItem(
                            state.schema,
                            targetString-1,
                            //Is there currently a drag action?
                            state.dragAction !== null ?
                                //Yes. Is it fingerless?
                                Shape.StringAction.isFingerless(state.dragAction) ?
                                    //Yes. Choose it.
                                    state.dragAction :
                                    //No. Choose it but at the first relative fret.
                                    {
                                        sounded: state.dragAction.sounded,
                                        finger: state.dragAction.finger,
                                        fret: Frets.Relative.first} :
                                //No. Is the current string unsounded?
                                state.schema[targetString-1] === Shape.StringAction.unsounded ?
                                    //Yes. Replace with open.
                                    Shape.StringAction.open :
                                    //No. Replace with unsounded.
                                    Shape.StringAction.unsounded)
                    ) => ({
                        change: schema[targetString - 1],
                        schema: schema}))})),
                Fretboard = Module.of((
                    padding=ShapeChart.FingerIndicator.Style.radius,
                    mouseXToClosestString=MouseXToClosestStringMapperBuilder
                        .withLeftPadding(padding)
                ) => ({
                    Style: {padding: padding},
                    mouseRegionStateToSchemaChange: state => Module.of((
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
                                Shape.StringAction.isFingered(stringAction) &&
                                stringAction.finger === targetFinger &&
                                stringAction.fret !== targetFret
                        ) => targetFinger === Fingers.any ? (   //Is targetFinger *?
                                //Yes. Only replace the string action at the targetString with unsounded if
                                //it is a fingered string action && the target finger && not the target fret.
                                isTargetFingerAndNotTargetFret(state.schema[targetString-1]) ?
                                    Arrays.replaceItem(state.schema, targetString-1, Shape.StringAction.unsounded) :
                                    state.schema) :
                            //No. Convert any same-fingered but different-fret string actions to unsounded.
                            state.schema.map(stringAction => isTargetFingerAndNotTargetFret(stringAction) ?
                                Shape.StringAction.unsounded :
                                stringAction)),
                        //Determine which stringAction will be used to substitute others.
                        //This depends on whether the mouse is being dragged and its drag action,
                        //or whether or not the existing string action on the target string
                        //is fingered and has a matching fret and finger
                        substituteStringAction = Module.of((dragAction=state.dragAction) => dragAction !== null ?
                            //The mouse is being dragged
                            Shape.StringAction.isFingerless(dragAction) ?
                                //The drag action is fingerless
                                dragAction :
                                dragAction.sounded === true ?
                                    //The drag action is fingered and sounded
                                    Shape.StringAction.fingered(targetFret, targetFinger) :
                                    //The drag action is deadened
                                    Shape.StringAction.deadened(targetFret, targetFinger) :
                            //The mouse is not being dragged
                            Module.of((currentAction = schema[targetString - 1]) =>
                                Shape.StringAction.isFingerless(currentAction) ||
                                currentAction.finger !== targetFinger ||
                                currentAction.fret !== targetFret
                                    ?
                                    //The target action is not over an identical string action
                                    Shape.StringAction.fingered(targetFret, targetFinger) : (
                                        //The target action is over an identical string action
                                        currentAction.sounded === true ?
                                            //And that action is sounded
                                            Shape.StringAction.deadened(targetFret, targetFinger) :
                                            //And that action is deadened
                                            Shape.StringAction.unsounded)))
                    ) => {
                        //A finger action may be created or extended if the substitute string action is
                        //not a deadened version of its sounded substitutee and the targetFinger is not *.
                        if(Shape.StringAction.isFingered(substituteStringAction) && targetFinger !== Fingers.any && (
                            substituteStringAction.sounded === true ||
                            Shape.StringAction.isFingerless(schema[targetString - 1]) ||
                            schema[targetString - 1].finger !== targetFinger)) {
                            //Yes. A finger may may have to be created or extended.
                            //Get the string actions with targetFret and targetFinger
                            const targetFingerAndFretActions = schema
                                .map((stringAction, i) => ({
                                    string: i+1,
                                    action: stringAction}))
                                .filter(stringAction =>
                                    stringAction.string !== targetString &&
                                    Shape.StringAction.isFingered(stringAction) &&
                                    stringAction.action.fret === targetFret &&
                                    stringAction.action.finger === targetFinger);
                            //Is there an existing finger action with the same finger and fret?
                            if(targetFingerAndFretActions.length > 0) {
                                //Yes. Fill the gap with the substitute action.
                                const minExtendedString = Math.min(targetString, targetFingerAndFretActions[0].string);
                                const maxExtendedString = Math.max(
                                    targetString,
                                    Arrays.last(targetFingerAndFretActions).string);
                                Numbers
                                    .range(
                                        1 + (
                                            targetString < targetFingerAndFretActions[0].string ?
                                                targetString :
                                                Arrays.last(targetFingerAndFretActions).string),
                                        1 + (
                                            targetString > Arrays.last(targetFingerAndFretActions).string ?
                                                targetString :
                                                targetFingerAndFretActions[0].string))
                                    .filter(string => {
                                        //Do not replace fingered string actions that are not at one of the ends
                                        //of the finger bar and with a different finger and higher fret
                                        const stringAction = schema[string - 1];
                                        return string === minExtendedString ||
                                            string === maxExtendedString ||
                                            Shape.StringAction.isFingerless(stringAction) ||
                                            stringAction.finger === substituteStringAction.finger ||
                                            stringAction.fret <= substituteStringAction.fret;})
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
                    mouseRegionStateToSchemaChange: state=>Module.of((
                        targetString = mouseXToClosestString(state.mousePosition[0]),
                        schema = Arrays.replaceItem(
                            state.schema,
                            targetString-1,
                            //Is there currently a drag action?
                            state.dragAction !== null ?
                                //Yes. Is it fingerless?
                                Shape.StringAction.isFingerless(state.dragAction) ?
                                    //Yes. Choose it.
                                    state.dragAction :
                                    //No. Choose it but at the last relative fret.
                                    {
                                        sounded: state.dragAction.sounded,
                                        finger: state.dragAction.finger,
                                        fret: Frets.Relative.last} :
                                //No. Is the current string action *?
                                state.schema[targetString-1] === Shape.StringAction.any ?
                                    //Yes. Replace with unsounded.
                                    Shape.StringAction.unsounded :
                                    //No. Replace with *.
                                    Shape.StringAction.any)
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
                        currentMouseRegion=null,  //The MouseRegion currently over-ed, or null
                        mousePositionToState=position => ({
                            mousePosition: position,
                            schema: Schema.get().slice(),
                            activeFinger: activeFingerGetter(),
                            dragAction: dragAction}),
                        createMouseEventListeners = stateToSchemaChangeMapper  => Module.of((
                            mouseEventToSchemaChange = e => stateToSchemaChangeMapper(mousePositionToState(e.position))
                        ) => ({
                            enter: function(e) {
                                currentMouseRegion = this;
                                const schema = mouseEventToSchemaChange(e).schema;
                                if(dragAction !== null) {
                                    Schema.set(schema, false);}
                                else {
                                    Preview.set(schema);}},
                            move: e => {
                                previousMousePosition = e.position;
                                const schema = mouseEventToSchemaChange(e).schema;
                                if(dragAction !== null) {
                                    Schema.set(schema, false);}
                                else {
                                    Preview.set(schema);}},
                            leave: () => {
                                currentMouseRegion = null;
                                Preview.set(null);},
                            down: e => {
                                const schemaChange = mouseEventToSchemaChange(e);
                                dragAction = schemaChange.change;
                                Schema.set(schemaChange.schema, false);
                                Preview.set(null);},
                            up: () => {
                                dragAction = null;
                                Preview.set(Schema.get());
                                Schema.callChangeListener();}})),
                        previousFretboardMousePosition=null,
                        fingerlessIndicatorMouseRegion=SVG.withClass(
                            SVG.Compositions.MouseRegion({
                                x: ShapeChart.FingerlessIndicator.Style.startX  -
                                    FingerlessIndicators.Style.padding.horizontal,
                                y: ShapeChart.FingerlessIndicator.Style.startY -
                                    FingerlessIndicators.Style.padding.vertical,
                                width: ShapeChart.Fretboard.Style.width +
                                    ShapeChart.FingerlessIndicator.Style.diameter +
                                    2 * FingerlessIndicators.Style.padding.horizontal,
                                height: ShapeChart.FingerlessIndicator.Style.diameter +
                                    ShapeChart.FingerlessIndicator.Style.margin +
                                    FingerlessIndicators.Style.padding.vertical,
                                listeners: createMouseEventListeners(
                                    FingerlessIndicators.mouseRegionStateToSchemaChange)}),
                            "fingerless-indicators-mouse-region"),
                        fretboardMouseRegion=SVG.withClass(
                            SVG.Compositions.MouseRegion({
                                x: ShapeChart.Fretboard.Style.x - Fretboard.Style.padding,
                                y: ShapeChart.Fretboard.Style.y,
                                width: ShapeChart.Fretboard.Style.width + 2 * Fretboard.Style.padding,
                                height: ShapeChart.Fretboard.Style.height + Fretboard.Style.padding,
                                listeners: createMouseEventListeners(Fretboard.mouseRegionStateToSchemaChange)}),
                            "fretboard-mouse-region"),
                        shapeInputMouseRegions=Objects.withMethod(
                            SVG.Builder(SVG.G())
                                .withClass("shape-input-mouse-regions")
                                .withChild(fingerlessIndicatorMouseRegion)
                                .withChild(fretboardMouseRegion)
                                .build(),
                            "activeFingerChanged",
                            () => {
                                if(currentMouseRegion === fretboardMouseRegion) {
                                    Preview.set(Fretboard
                                        .mouseRegionStateToSchemaChange(
                                            mousePositionToState(previousMousePosition))
                                        .schema)}})
                    ) => includeAnyStringAction === false ?
                        shapeInputMouseRegions :          //Do not include 'any string action' mouse region
                        SVG.withChild( //Do include...
                            shapeInputMouseRegions,
                            SVG.Builder(
                                SVG.Compositions.MouseRegion({
                                    x: ShapeChart.FingerlessIndicator.Style.startX -
                                        AnyStringAction.Style.padding.horizontal,
                                    y: ShapeChart.Fretboard.Style.y +
                                        ShapeChart.Fretboard.Style.height,
                                    width: ShapeChart.Fretboard.Style.width +
                                        ShapeChart.FingerlessIndicator.Style.diameter +
                                        2 * AnyStringAction.Style.padding.horizontal,
                                    height: ShapeChart.FingerlessIndicator.Style.diameter +
                                        ShapeChart.FingerlessIndicator.Style.margin +
                                        AnyStringAction.Style.padding.vertical}))
                                .withClass("fingerless-indicators-mouse-region")
                                .withModification(function() {
                                    SVG.Compositions.MouseRegion.withListeners(
                                        this,
                                        createMouseEventListeners(
                                            AnyStringAction.mouseRegionStateToSchemaChange,
                                            this));})
                                .build()))
                ) => ({
                    withAnyStringAction: () => withAnyStringActionStep(true),
                    withoutAnyStringAction: () => withAnyStringActionStep(false)}))})})})),
            createShapeInput=(schema, withWildcards) => Module.of((
                shapeChart = SVG.withModification(
                    ShapeChart.Builder
                        .forSchema(schema)
                        .unfixed(),
                    function() {
                        this.skeleton.preview = true;
                        this.skeleton.anyStringAction = withWildcards;}),
                previewMeatContainer = SVG.withAttributes(SVG.G(), {
                    class: "preview-meat-container",
                    fillOpacity: .4,
                    strokeOpacity: .5}),
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
                            SVG.withChild(previewMeatContainer, ShapeChart.MeatBuilder.forSchema(preview));
                            // Is the old preview nothing?
                            if(value === null) {
                                //Yes. Make the active meat translucent.
                                SVG.withAttributes(shapeChart.meat,{
                                    fillOpacity: .6,
                                    strokeOpacity: .5});}}
                        //The new preview is nothing. Is the old preview something?
                        else if(value !== null) {
                            //Yes. Make the active meat opaque
                            SVG.withoutAttributes(shapeChart.meat, "fill-opacity", "stroke-opacity");}
                        //Update the value
                        value = preview;}})),
                Schema = Module.of((
                    changeListener=Functions.noop,
                    // Reroute the shape chart's 'schema' setter to use Schema's;
                    // this ShapeInput will also have the same schema setter.
                    shapeChartSchemaSetter = Object.getOwnPropertyDescriptor(shapeChart, "schema").set,
                    schemaSetter = (schema, callListener=true) => {
                        if(! Shape.Schema.equals(schema, shapeChart.schema)) {
                            shapeChartSchemaSetter(schema);
                            if(callListener === true) {
                                changeListener(schema);}}}
                ) => {
                    Objects.withSetter(shapeChart, "schema", schemaSetter);
                    const Schema = {
                        setChangeListener: listener => changeListener = listener,
                        get: () => shapeChart.schema,
                        set: schemaSetter,
                        callChangeListener: () => changeListener(shapeChart.schema)};
                    Schema.set(schema);
                    return Schema;}),
                mouseRegions = MouseRegionsBuilder
                    .withSchema(Schema)
                    .withPreview(Preview)
                    .withActiveFingerGetter(() => fingerInput.selected)[
                        withWildcards === true ?
                            "withAnyStringAction" :
                            "withoutAnyStringAction"]()
            ) => Objects.Builder(
                SVG.Builder(SVG.G())
                    .withClass("shape-input")
                    .withChild(SVG.withChildren(shapeChart, previewMeatContainer, mouseRegions))
                    .withChild(SVG.moveTo(
                        //When the selected finger updates, refresh the preview
                        fingerInput.withChangeListener(mouseRegions.activeFingerChanged),
                        ShapeChart.Style.width + shapeChartMarginRight,
                        ShapeChart.Fretboard.Style.y))
                    .build())
                .withGetterAndSetter("schema", Schema.get, Schema.set)
                .withMethods({
                    withChangeListener: function(changeListener) {
                        Schema.setChangeListener(changeListener);
                        return this;},
                    focus: () => fingerInput.focus(),
                    focused: function() {
                        this.focus();
                        return this;},
                    unfocus: () => fingerInput.unfocus(),
                    unfocused: function() {
                        this.unfocus();
                        return this;}})
                .build()),
            withSchemaStep = includeWildcards => ({
                withSchema: schema => createShapeInput(schema, includeWildcards),
                blank: () => createShapeInput(
                    includeWildcards === true ?
                        Shape.Schema.allAnyStringAction() :
                        Shape.Schema.allUnsounded(),
                    includeWildcards)})
        ) => ({
            withWildcards: () => withSchemaStep(true),
            withoutWildcards: () => withSchemaStep(false)}))}));

    const RootFretRangeInput = Module.of((
        RootFretRangeStyle = Module.of((
            rangeMarkerRadius=11,
            tickRadius = (3/8) * rangeMarkerRadius,
            skeletonHeight = 2 * tickRadius,
            mouseRegionHorizontalPadding = rangeMarkerRadius,
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
            mouseRegionHorizontalPadding: mouseRegionHorizontalPadding,
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
                baseline = SVG.Builder(SVG.Line([0, 0], [width, 0]))
                    .withClass("root-fret-range-input-baseline")
                    .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth)
                    .build(),
                activeBaseline = Objects.withMethod(
                    SVG.Builder(SVG.Line())
                        .withClass("root-fret-range-input-active-baseline")
                        .withStrokeWidth(RootFretRangeStyle.activeStrokeWidth)
                        .build(),
                    "withRange", function(min, max) {
                        return min !== max ?
                            SVG.show(
                                SVG.Line.withEndpoints(
                                    this,
                                    [rootFretToXCoordinate(min), 0],
                                    [rootFretToXCoordinate(max), 0])) :
                            SVG.hide(this);}),
                skeleton = SVG.Builder(SVG.G())
                    .withClass("root-fret-range-skeleton")
                    .withChildren(baseline, activeBaseline)
                    .withChild(SVG.Builder(SVG.G())
                        .withClass("root-fret-range-ticks")
                        .withAttribute("stroke-width", RootFretRangeStyle.normalStrokeWidth)
                        .withChildren(...rootFretXCoordinates.map(rootFretXCoordinate=>SVG.Builder(
                            SVG.Line(
                                [rootFretXCoordinate.x, -RootFretRangeStyle.tickRadius],
                                [rootFretXCoordinate.x, RootFretRangeStyle.tickRadius]))
                            .withClass("root-fret-range-tick")
                            .withDataAttribute("value", rootFretXCoordinate.rootFret)
                            .build()))
                        .build())
                    .build(),
                rangeLabel = Module.of((
                    createText=()=>SVG.Builder(SVG.Text())
                        .centerAlign()
                        .withAttributes({
                            fontFamily: RootFretRangeStyle.rangeLabelFont,
                            fontSize: RootFretRangeStyle.rangeLabelFontSize})
                        .build(),
                    expressionText=SVG.withClass(
                        SVG.Text.withTextContent(createText(), "<= r <="),
                        "root-fret-range-input-label-min"),
                    minText=SVG.Builder(createText())
                        .withClass("root-fret-range-input-label-min")
                        .move(-RootFretRangeStyle.rangeLabelTextSpacing, 0)
                        .build(),
                    maxText=SVG.Builder(createText())
                        .withClass("root-fret-range-input-label-max")
                        .move(RootFretRangeStyle.rangeLabelTextSpacing, 0)
                        .build()
                ) => Objects.withMethods(
                    SVG.Builder(SVG.G())
                        .withClass("root-fret-range-input-label")
                        .withChildren(minText, expressionText, maxText)
                        .moveTo(
                            .5 * width,
                            RootFretRangeStyle.skeletonHeight + RootFretRangeStyle.rangeLabelMarginTop)
                        .build(),
                    {
                        withRange: function(minRootFret, maxRootFret) {
                            SVG.Text.withTextContent(minText, minRootFret);
                            SVG.Text.withTextContent(maxText, maxRootFret);
                            return this;},
                        withValue: function(rootFret) {
                            return this.withRange(rootFret, rootFret);}})),
                rangeMarkers = Module.of((
                    rootFretToCenter=rootFret=>[rootFretToXCoordinate(rootFret), 0],
                    rootFret=null,
                    moveMarkerToRootFret=(marker, rootFret)=>SVG.Circle.withCenter(marker, rootFretToCenter(rootFret)),
                    markerForType=markerType=>Objects.Builder(
                        SVG.Builder(SVG.Circle([0,0], RootFretRangeStyle.rangeMarkerRadius))
                            .withClass("root-fret-range-marker")
                            .withAttributes({
                                cursor: "pointer",
                                pointerEvents: "all",
                                fill: "none"})
                            .withDataAttribute("markerType", markerType)
                            .hide()
                            .build())
                        .withGetter("type", () => markerType)
                        .withModification(function() {
                            const RootFret = Module.of((value=null) => ({
                                get: () => value,
                                set: rootFret => {
                                    if(rootFret !== value) {
                                        if(rootFret !== null) {
                                            SVG.Circle.withCenter(this, rootFretToCenter(rootFret));
                                            if(value === null) {
                                                SVG.show(this);}}
                                        else {
                                            SVG.hide(this);}
                                        value = rootFret;}}}));
                            Objects.Builder(this)
                                .withGetterAndSetter("rootFret", RootFret.get, RootFret.set)
                                .withMethods({
                                    atRootFret: function(rootFret) {
                                        this.rootFret = rootFret;
                                        return this;},
                                    withoutRootFret: function() {
                                        this.rootFret = null;
                                        return this;}})
                                .build()})
                        .withMethods({
                            deactivate: function() {
                                SVG.withStrokeWidth(this, RootFretRangeStyle.normalStrokeWidth);},
                            deactivated: function() {
                                this.deactivate();
                                return this;},
                            emphasize: function() {
                                SVG.withStrokeWidth(this, RootFretRangeStyle.emphasisStrokeWidth);},
                            emphasized: function() {
                                this.emphasize();
                                return this;},
                            activate: function() {
                                SVG.withStrokeWidth(this, RootFretRangeStyle.activeStrokeWidth);},
                            activated: function() {
                                this.activate();
                                return this;}})
                        .build()
                        .deactivated(),
                    min=markerForType("min"),
                    max=markerForType("max"),
                    pivot=markerForType("pivot"),
                    preview=SVG.withAttributes(markerForType("preview"), {
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
                            const range = Frets.Range(min, max);
                            if(value !== undefined && Frets.Range.equals(value, range)) {
                                return;}
                            //Is the new range a single value?
                            if(isSingleValue(range)) {
                                //Yes.
                                SVG.hide(activeBaseline);
                                rangeLabel.withValue(range.min);
                                rangeMarkers.pivot.atRootFret(range.min);
                                //Was the old range not a single value?
                                if(value === undefined || ! isSingleValue(value)) {
                                    //Yes. Swap which markers are visible.
                                    rangeMarkers.minAndMax.forEach(rangeMarker => rangeMarker.rootFret = null);}}
                            else {
                                //No.
                                SVG.show(activeBaseline);
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
                mouseRegion = SVG.withClass(
                    SVG.Compositions.MouseRegion({
                        x: -RootFretRangeStyle.mouseRegionHorizontalPadding,
                        y: -.5 * RootFretRangeStyle.height,
                        width: width + 2 * RootFretRangeStyle.mouseRegionHorizontalPadding,
                        height: RootFretRangeStyle.height}),
                    "root-fret-range-mouse-region"),
                States = Module.of((
                    mouseRegionXToRootFret = x => xCoordinateToRootFret(
                        x - RootFretRangeStyle.mouseRegionHorizontalPadding),
                    markerEventToRootFret = e =>
                        mouseRegionXToRootFret(MouseEvents.relativeMousePosition(e, mouseRegion)[0]),
                    States={
                        Inactive: Module.of((
                            visibleRangeMarkers=[],
                            changeToDraggingState=activeRangeMarker=>{
                                PreviewRootFret.unset();
                                SVG.Compositions.MouseRegion.disable(mouseRegion);
                                visibleRangeMarkers.forEach(marker => SVG.withoutEventListeners(
                                    marker,
                                    markersEventListeners[marker.type]));
                                States.Dragging.activate(activeRangeMarker);},
                            PreviewRootFret=Module.of((
                                value=null,
                                EmphasizedMarker=Module.of((emphasizedMarker=null) => ({
                                    unset: () => {
                                        if(emphasizedMarker !== null) {
                                            emphasizedMarker.deactivate();
                                            emphasizedMarker = null;}},
                                    atRootFret: rootFret => {
                                        EmphasizedMarker.unset();
                                        visibleRangeMarkers.forEach(visibleMarker => Functions.ifThen(
                                            visibleMarker.rootFret === rootFret,
                                            () => {
                                                visibleMarker.emphasize();
                                                emphasizedMarker = visibleMarker;}));}}))
                            ) => ({
                                set: rootFret => {
                                    if(value !== rootFret) {
                                        EmphasizedMarker.atRootFret(rootFret);
                                        rangeMarkers.preview.atRootFret(rootFret);
                                        value = rootFret;}},
                                unset: () => PreviewRootFret.set(null)})),
                            markersEventListeners = Object.fromEntries(rangeMarkers.minMaxAndPivot.map(marker => [
                                marker.type,
                                {
                                    mouseEnter: () => PreviewRootFret.set(marker.rootFret),
                                    mouseLeave: () => PreviewRootFret.unset(),
                                    mouseDown: () => changeToDraggingState(marker)}]))
                        ) => {
                            //The mouse region is only relevant within the inactive state,
                            //so its listeners are set up within its definition.
                            SVG.Compositions.MouseRegion.withListeners(mouseRegion, {
                                enter: e => PreviewRootFret.set(mouseRegionXToRootFret(e.position[0])),
                                move: e => PreviewRootFret.set(mouseRegionXToRootFret(e.position[0])),
                                down: e => {
                                    Range.set(mouseRegionXToRootFret(e.position[0]));
                                    changeToDraggingState(rangeMarkers.pivot);},
                                leave: () => PreviewRootFret.unset()});
                            return {
                                activate: () => {
                                    visibleRangeMarkers = Range.isSingleValue() ?
                                        [rangeMarkers.pivot] :
                                        rangeMarkers.minAndMax;
                                    visibleRangeMarkers.forEach(marker =>
                                        SVG.withEventListeners(marker, markersEventListeners[marker.type]));
                                    SVG.Compositions.MouseRegion.enable(mouseRegion);}};}),
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
                            SubStates = Module.of((
                                thresholdFret=null,
                                activeState=null,
                                switchActive=(marker, newThresholdFret)=>{
                                    if(activeState !== null) {
                                        window.removeEventListener("mousemove", SubStates.activeState.mouseMove);}
                                    activeState = marker.type;
                                    ActiveMarker.set(marker);
                                    thresholdFret = newThresholdFret;
                                    window.addEventListener("mousemove", SubStates.activeState.mouseMove);}
                            ) => Objects.withGetter(
                                {
                                    min: {
                                        mouseMove: e => {
                                            const rootFret = markerEventToRootFret(e);
                                            if(rootFret === thresholdFret) {
                                                Range.set(rootFret);
                                                SubStates.pivot.activate();}
                                            else if(rootFret > thresholdFret) {
                                                Range.set(thresholdFret, rootFret);
                                                SubStates.max.activate();}
                                            else {
                                                Range.set(rootFret, thresholdFret);}},
                                        activate: () => switchActive(rangeMarkers.min, Range.get().max)},
                                    max: {
                                        mouseMove: e=>{
                                            const rootFret = markerEventToRootFret(e);
                                            if(rootFret === thresholdFret) {
                                                Range.set(rootFret);
                                                SubStates.pivot.activate();}
                                            else if(rootFret < thresholdFret) {
                                                Range.set(rootFret, thresholdFret);
                                                SubStates.min.activate();}
                                            else {
                                                Range.set(thresholdFret, rootFret);}},
                                        activate: () => switchActive(rangeMarkers.max, Range.get().min)},
                                    pivot: {
                                        mouseMove: e=>{
                                            const rootFret = markerEventToRootFret(e);
                                            if(rootFret > thresholdFret) {
                                                SVG.hide(rangeMarkers.pivot.deactivated());
                                                Range.set(thresholdFret, rootFret);
                                                SubStates.max.activate();}
                                            else if (rootFret < thresholdFret) {
                                                SVG.hide(rangeMarkers.pivot.deactivated());
                                                Range.set(rootFret, thresholdFret);
                                                SubStates.min.activate();}},
                                        activate: () => {
                                            switchActive(rangeMarkers.pivot, rangeMarkers.pivot.rootFret);
                                            rangeMarkers.minAndMax.forEach(SVG.hide);}}},
                                "activeState", () => SubStates[activeState])),
                            mouseUpListener = e=>{
                                const relativeMousePosition=MouseEvents.relativeMousePosition(e, mouseRegion);
                                const activeMarker = ActiveMarker.get();
                                ActiveMarker.set(null);
                                if(
                                    //Is the mouse  over the active marker's root fret
                                    markerEventToRootFret(e) === activeMarker.rootFret &&
                                    //or not within the RootFretInput's bounding box?
                                    relativeMousePosition[0] >= 0 &&
                                    relativeMousePosition[1] >= 0 &&
                                    relativeMousePosition[0] <= width &&
                                    relativeMousePosition[1] <= RootFretRangeStyle.height
                                ) {
                                    //No. Emphasize the active marker.
                                    activeMarker.emphasize();}
                                window.removeEventListener("mousemove", SubStates.activeState.mouseMove);
                                window.removeEventListener("mouseup", mouseUpListener);
                                States.Inactive.activate();}
                        ) => ({
                            activate: activeMarker => {
                                SubStates[activeMarker.type].activate();
                                window.addEventListener("mousemove", SubStates.activeState.mouseMove);
                                window.addEventListener("mouseup", mouseUpListener);}}))},
                ) => States.Inactive.activate())
            ) => Objects.Builder(
                SVG.Builder(SVG.G())
                    .withClass("root-fret-range-input")
                    .withChildren(skeleton, rangeLabel, mouseRegion)
                    .withChild(SVG.Builder(SVG.G())
                        .withClass("root-fret-range-markers")
                        .withChildren(...rangeMarkers.all)
                        .build())
                    .build())
                .withGetterAndSetter("range",
                    () => Range.get(),
                    range => Range.set(range.min, range.max))
                .withMethods({
                    withRange: function(range) {
                        this.range = range;
                        return this;},
                    withChangeListener: function(changeListener) {
                        Range.setChangeListener(changeListener);
                        return this;}})
                .build())})}}));

    const ShapeForm = Module.of((
        ShapeFormStyle = Module.of((
            width=ShapeInput.Style.width,
            RootFretRangeStyle = Module.of((marginTop=29) => ({
                x: ShapeChart.Fretboard.Style.x,
                y: ShapeChart.Style.height + marginTop,
                marginTop: marginTop})),
            ButtonsStyle=Module.of((
                buttonsMarginTop = 0,
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
            ErrorMessageStyle=Module.of((marginTop = 12) => ({
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
            ErrorMessage: ErrorMessageStyle})),
        ShapeValidations = Module.of((
            ShapeValidationBuilder={
                withFailCondition: conditional => Module.of((
                    createValidation=errorMessage=>(schema, fingerActions, rootFretRange) =>
                        conditional(schema, fingerActions, rootFretRange) === true ? errorMessage : null
                ) => ({
                    withErrorMessage: createValidation,
                    withoutErrorMessage: () => createValidation("")}))}
        ) => ({
            Builder: ShapeValidationBuilder,
            common:[
                ShapeValidationBuilder
                    .withFailCondition((schema, fingerActions) => fingerActions.length  === 0)
                    .withErrorMessage("A shape must use at least one finger"),
                ShapeValidationBuilder
                    .withFailCondition((schema, fingerActions) => Object.values(
                        fingerActions.reduce(
                            (numPerFinger, fingerAction) => {
                                undefined === numPerFinger[fingerAction.finger] ?
                                    numPerFinger[fingerAction.finger] = 1 :
                                    ++numPerFinger[fingerAction.finger];
                                return numPerFinger;},
                            {}))
                        .some(count => count > 1))
                    .withErrorMessage("A finger is used multiple times on a fret"),
                ShapeValidationBuilder
                    .withFailCondition((schema, fingerActions) => ! fingerActions.some(fingerAction =>
                        fingerAction.fret === Frets.roots.first))
                    .withErrorMessage("Fingers are used, but not on the root fret"),
                ShapeValidationBuilder
                    .withFailCondition((schema, fingerActions) => Object
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
                                return outOfOrder;});}))
                    .withErrorMessage("Fingers are crossed on a fret")],
            forCreation: [
                ShapeValidationBuilder
                    .withFailCondition(schema =>
                        Shape.Schema.equals(schema, Shape.Schema.allUnsounded()))
                    .withErrorMessage("Enter a shape"),
                ShapeValidationBuilder
                    .withFailCondition(schema => Shape.existsWithSchema(schema))
                    .withErrorMessage("A matching shape already exists")],
            forEditing: idShape => [
                ShapeValidationBuilder
                    .withFailCondition(schema =>
                        Shape.Schema.equals(schema, Shape.Schema.allUnsounded()))
                    .withErrorMessage("Shape cannot be empty"),
                ShapeValidationBuilder
                    .withFailCondition(schema => Module.of((
                        existingShape=Shape.getWithSchema(schema)
                    ) => ! (existingShape === undefined || existingShape.id === idShape)))
                    .withErrorMessage("A matching shape already exists")]}))
    ) =>({
        Style: {
            width: ShapeFormStyle.width,
            height: ShapeFormStyle.height},
        Builder: () => Module.of((
            shapeInput = undefined,
            reset = undefined,
            save = undefined,
            shapeValidations = undefined,
            rootFretRangeInput=undefined,
            output = SVG.Builder(SVG.Text())
                .withClass("shape-form-output")
                .moveTo(ShapeFormStyle.ErrorMessage.x, ShapeFormStyle.ErrorMessage.y)
                .centerAlign()
                .bottomAlign()
                .withAttributes({
                    fontSize: ShapeFormStyle.ErrorMessage.fontSize,
                    fontFamily: ShapeFormStyle.ErrorMessage.fontFamily})
                .build(),
            resetButton = SVG.Builder(
                SVG.Compositions.TextButton({
                    width: ShapeFormStyle.Buttons.width,
                    height: ShapeFormStyle.Buttons.height,
                    text: "Reset",
                    clickListener: () => reset()}))
                .withClass("shape-form-reset-button")
                .moveTo(ShapeFormStyle.Buttons.startX + ShapeFormStyle.Buttons.height, ShapeFormStyle.Buttons.y)
                .build(),
            saveButton = SVG.Builder(
                SVG.Compositions.TextButton({
                    width: ShapeFormStyle.Buttons.width,
                    height: ShapeFormStyle.Buttons.height,
                    text: "Save",
                    clickListener: () => {
                        save();
                        output.textContent = "Saved";}}))
                .withClass("shape-form-save-button")
                .moveTo(
                    ShapeFormStyle.Buttons.startX + 2 * ShapeFormStyle.Buttons.height + ShapeFormStyle.Buttons.width,
                    ShapeFormStyle.Buttons.y)
                .build(),
            doValidations=Module.of((
                invalidSaveButtonEventListeners = {
                    mouseEnter: function() {
                        SVG.withTextDecoration(output, "underline"); },
                    mouseLeave: function() {
                        SVG.withoutAttribute(output, "text-decoration"); }},
                invalidate=reason => {
                    output.textContent = reason;
                    SVG.Compositions.TextButton.disable(
                        SVG.withEventListeners(saveButton, invalidSaveButtonEventListeners));},
                validate=() => {
                    output.textContent = null;
                    SVG.Compositions.TextButton.enable(
                        SVG.withoutEventListeners(saveButton, invalidSaveButtonEventListeners));}
            ) => () => {
                const schema = shapeInput.schema;
                const fingerActions=Shape.Schema.getFingerActions(schema);
                const rootFretRange = rootFretRangeInput.range;
                for(const validation of shapeValidations) {
                    const errorReason = validation(schema, fingerActions, rootFretRange);
                    if(errorReason !== null) {
                        return invalidate(errorReason);}}
                validate();}),
            shapeFormWithSchemaAndRange=(schema, range) => {
                shapeInput=ShapeInput.Builder
                    .withoutWildcards()
                    .withSchema(schema)
                    .focused()
                    .withChangeListener(doValidations);
                rootFretRangeInput=Module.of((padding=8) => SVG.move(
                    RootFretRangeInput.Builder
                        .withRange(range)
                        .withWidth(ShapeFormStyle.width - 2 * padding)
                        .withChangeListener(doValidations),
                    padding,
                    ShapeFormStyle.RootFretRange.y));
                doValidations();
                return SVG.Builder(SVG.G())
                    .withClass("shape-form")
                    .withChildren(shapeInput, rootFretRangeInput, resetButton, saveButton, output)
                    .build();}
        ) => ({
            forEditing: shape => {
                shapeValidations = ShapeValidations.forEditing(shape.id)
                    //Extra validation - is the shape same as original? No error message.
                    .concat([ShapeValidations.Builder
                        .withFailCondition((schema, fingerActions, rootFretRange) => Module.of((
                            currentShape=Shape.all[shape.id]
                        ) => Shape.Schema.equals(schema, currentShape.schema) &&
                            Frets.Range.equals(rootFretRange, currentShape.range)))
                        .withoutErrorMessage()])
                    .concat(ShapeValidations.common);
                reset = () => {
                    const shapeToResetTo = Shape.all[shape.id];
                    shapeInput.schema = shapeToResetTo.schema;
                    rootFretRangeInput.range = shapeToResetTo.range;};
                save = () => {
                    Shape.update(Shape.Builder(shape)
                        .withSchema(shapeInput.schema)
                        .withRange(rootFretRangeInput.range)
                        .build());
                    doValidations();
                    reset();};
                return shapeFormWithSchemaAndRange(shape.schema, shape.range);},
            forCreation: () => {
                shapeValidations = ShapeValidations.forCreation
                    .concat(ShapeValidations.common);
                reset = () => {
                    shapeInput.schema = Shape.Schema.allUnsounded();
                    rootFretRangeInput.range = Frets.Range.roots;
                    output.textContent = null; };
                save = () => {
                    Shape.add(Shape.Builder()
                        .withSchema(shapeInput.schema)
                        .withRange(rootFretRangeInput.range)
                        .build());
                    doValidations();};
                return shapeFormWithSchemaAndRange(Shape.Schema.allUnsounded(), Frets.Range.roots);}}))}));
    
    const ShapesLibrary = Module.of((
        shapeFilterMarginRight=32,
        topRowMarginBottom=10,
        shapeChartGridPadding= {
            horizontal: 5,
            vertical: 5 },
        shapeChartMarginTop=5,
        shapeChartGridMaxColumns=4,
        pageInputMarginTop=25,
        pageInputCellSize=25,
        maxMatches=12,
        pageOfShape=id=>Math.ceil((1+id)/maxMatches) - 1,
        width = shapeChartGridMaxColumns*ShapeChart.Style.width +
            (shapeChartGridMaxColumns-1)*shapeChartGridPadding.horizontal
    ) => ({
        Style: {
            width: width},
        new: () => Module.of((
            matches=[],
            refreshShapesList=selectedPage => {
                const startIndex = selectedPage*maxMatches;
                SVG.Compositions.ModularGrid.setModules(
                    shapeChartGrid,
                    ...ShapeItem.shapesToShapeItems(
                        matches.slice(startIndex, startIndex+maxMatches)));},
            pageSliderMax = () => Math.max(Math.ceil(matches.length/maxMatches)-1,0),
            updatePageInputRange=() => {
                if(matches.length === 0) {
                    pageInput.max = 0;
                    pageInput.enabled = false;}
                else {
                    pageInput.enabled = true;
                    pageInput.max = pageSliderMax();}
                SVG.yTo(shapeChartGrid,
                    ShapesPageTopRow.Style.endY + shapeChartMarginTop + pageInputMarginTop +
                    Math.max(pageInput.max.toString().length, 1)*pageInputCellSize);},
            updateMatches=(pageNumber=pageInput.value)=>{
                matches = Shape.search(shapeFilterInput.schema);
                updatePageInputRange();
                pageInput.value = pageNumber;
                refreshShapesList(pageNumber);},
            ShapeItem=Module.of((
                deleteButtonWidth=65,
                editButtonWidth=40,
                moduleWidth=deleteButtonWidth-10,
                buttonHeight=18,
                buttonPadding=3,
                buttonsContainerOffsetX=-4,
                buttonsContainerOffsetY=35
            ) => ({
                Style: {
                    width: ShapeChart.Style.width,
                    height: ShapeChart.Style.height},
                shapesToShapeItems: shapes => shapes
                    .slice(0, maxMatches)
                    .map(shape=>SVG.Builder(SVG.G())
                        .withClass("shape-item")
                        .withChild(ShapeChart.Builder
                            .forSchema(shape.schema)
                            .unfixed())
                        .withChild(SVG.Builder(SVG.Compositions.ModularGrid({ //Buttons container
                            moduleSize: {
                                width: moduleWidth,
                                height: buttonHeight},
                            padding: buttonPadding,
                            columns: 2,
                            modules: [
                                SVG.Compositions.ActionText({
                                    text: "edit",
                                    width: editButtonWidth,
                                    height: buttonHeight,
                                    clickListener: () => {
                                        shapeFilterInput.unfocus();
                                        SVG.withChild(chordJogApp, SVG.Compositions.Modal({
                                            content: ShapeForm.Builder().forEditing(Shape.all[shape.id]),
                                            width: ShapeForm.Style.width,
                                            height: ShapeForm.Style.height,
                                            closeListener: () => {
                                                shapeFilterInput.focus();
                                                updateMatches();}}))}}),
                                SVG.Compositions.ActionText({
                                    text: "delete",
                                    width: deleteButtonWidth,
                                    height: buttonHeight,
                                    clickListener: () => {
                                        if(true===confirm("Are you sure you want to delete this shape?")) {
                                            Shape.delete(shape.id);
                                            updateMatches(pageOfShape(shape.id < Shape.all.length ?
                                                shape.id :
                                                shape.id - 1));}}})]}))
                            .moveTo(
                                ShapeChart.RootFretLabel.Style.x + buttonsContainerOffsetX,
                                ShapeChart.Style.height - buttonsContainerOffsetY)
                            .withClass("shape-item-buttons-container")
                            .rotateTo(270)
                            .build())
                        .build())})),
            ShapesPageTopRow=Module.of((
                setupShapeFilterInput=shapeFilterInput=ShapeInput.Builder
                    .withWildcards()
                    .blank()
                    .focused()
                    .withChangeListener(()=>updateMatches(0)),
                shapesFilterContainer=SVG.Builder(SVG.G())
                    .withClass("shapes-filter-container")
                    .withChild(shapeFilterInput)
                    .withChild(Module.of((
                        filterLabelPosition=[
                            ShapeChart.RootFretLabel.Style.x - 4,
                            ShapeChart.RootFretLabel.Style.y + 70],
                        filterLabelWidth=19,
                        filterLabelTextLength=80,
                        filterLabelHeight=108
                    ) => SVG.Builder(SVG.Compositions.ActionText({
                            text: "reset",
                            width: filterLabelWidth,
                            height: filterLabelHeight,
                            clickListener: () => {
                                shapeFilterInput.schema = Shape.Schema.allAnyStringAction();
                                pageInput.value = 0;}}))
                        .withClass("filter-button")
                        .moveTo(...filterLabelPosition)
                        .withModification(function(){
                            SVG.rotateTo(this.label,270);})
                        .build()))
                    .build(),
                shapesButtonContainer=Module.of((
                    buttonWidth = width - ShapeInput.Style.width - shapeFilterMarginRight+5,
                    numButtons=3,
                    buttonHeight=ShapeChart.Fretboard.Style.height/numButtons,
                    buttonIndexToYCoordinate=index=>index*buttonHeight,
                    createShapeButton=SVG.Compositions.TextButton({
                        width: buttonWidth,
                        height: buttonHeight,
                        text: "Create",
                        clickListener: () => {
                            shapeFilterInput.unfocus();
                            SVG.withChild(chordJogApp, SVG.Compositions.Modal({
                                content: ShapeForm.Builder().forCreation(),
                                width: ShapeForm.Style.width,
                                height: ShapeForm.Style.height,
                                closeListener: () => {
                                    updateMatches();
                                    shapeFilterInput.focus();}}));}}),
                    downloadShapesButton=SVG.yTo(
                        SVG.Compositions.TextButton({
                            text: "Download",
                            width: buttonWidth,
                            height: buttonHeight,
                            clickListener: Shape.download}),
                        buttonIndexToYCoordinate(1)),
                    uploadShapesButtonContainer=Module.of((
                        nonInteractiveToInteractiveWidthRatio=1/3,
                        medianWidth=18,
                        medianStartX=nonInteractiveToInteractiveWidthRatio*buttonWidth - medianWidth
                    ) => SVG.Builder(SVG.G())
                        .withClass("upload-buttons-container")
                        .moveTo(0, buttonIndexToYCoordinate(2))
                        .centerAlign()
                        .withFontSize(17)
                        .withFontFamily("Courier New")
                        .withChild(SVG.Builder(SVG.G())
                            .withClass("upload-buttons-label-container")
                            .withChild(SVG.Builder(SVG.Rect({width: medianStartX, height: buttonHeight}))
                                .withClass("upload-buttons-label-outline")
                                .withFill("#D0D0D0")
                                .build())
                            .withChild(SVG.Builder(SVG.Text("Upload"))
                                .withClass("upload-buttons-label")
                                .moveTo(.5 * medianStartX, .5 * buttonHeight)
                                .withDominantBaseline("middle")
                                .build())
                            .build())
                        .withChild(SVG.Builder(SVG.G())
                            .withClass("upload-buttons-median-container")
                            .moveTo(medianStartX, 0)
                            .withChild(SVG.Builder(SVG.Rect({width: medianWidth, height: buttonHeight}))
                                .withClass("upload-buttons-median-outline")
                                .withFill("#D0D0D0")
                                .build())
                            .withChild(SVG.Builder(SVG.Text.withTextLength(SVG.Text("and"), buttonHeight - 10))
                                .withClass("upload-buttons-median-label")
                                .moveTo(.5 * medianWidth, .5 * buttonHeight)
                                .rotateTo(270)
                                .withDominantBaseline("middle")
                                .build())
                            .build())
                        .withChild(Module.of((
                            optionWidth=(1-nonInteractiveToInteractiveWidthRatio) * buttonWidth,
                            optionHeight=.5*buttonHeight
                        ) => SVG.Builder(SVG.G())
                            .withClass("upload-buttons-options-container")
                            .moveTo(medianStartX + medianWidth, 0)
                            .withChild(SVG.Compositions.TextButton({
                                width: optionWidth,
                                height: optionHeight,
                                text: "Append",
                                clickListener: () => Shape.upload(updateMatches)}))
                            .withChild(SVG.yTo(
                                SVG.Compositions.TextButton({
                                    width: optionWidth,
                                    height: optionHeight,
                                    text: "Replace",
                                    clickListener: () => Shape.upload(updateMatches, true)}),
                                optionHeight))
                            .build()))
                        .build())
                ) => SVG.Builder(SVG.G())
                    .withClass("shapes-button-actions-container")
                    .move(ShapeInput.Style.width + shapeFilterMarginRight, ShapeChart.Fretboard.Style.y)
                    .withChildren(createShapeButton, uploadShapesButtonContainer , downloadShapesButton)
                    .build())
            ) => ({
                Style: {endY: ShapeInput.Style.height},
                element: SVG.Builder(SVG.G())
                    .withClass("shape-page-top-row")
                    .withChild(shapesFilterContainer)
                    .withChild(shapesButtonContainer)
                    .build()})),
            shapeChartGrid=SVG.withClass(
                SVG.Compositions.ModularGrid({
                    moduleSize: {
                        width: ShapeChart.Style.width,
                        height: ShapeItem.Style.height},
                    columns: 4,
                    padding: shapeChartGridPadding.horizontal + shapeChartGridPadding.vertical}),
                "shape-chart-grid"),
            pageInput = SVG.moveTo(
                SVG.Compositions.NumberByDigitInput({
                    cellSize: pageInputCellSize,
                    max: pageSliderMax(),
                    changeListener: refreshShapesList}),
                .5*(Style.width - 10*pageInputCellSize),
                ShapesPageTopRow.Style.endY + pageInputMarginTop)
        ) => {
            updateMatches(0);
            return Objects.withMethod(
                SVG.Builder(SVG.G())
                    .withClass("shapes-library")
                    .withChildren(ShapesPageTopRow.element, pageInput, shapeChartGrid)
                    .build(),
                "refresh", updateMatches);})}));

    const ShapesGenerator = Module.of((
        defaultNumChords=8,
        numShapesInputCellSize= 30,
        numChordsRange = {
            min: 1,
            max: 12},
        generateButtonSize={
            width: ShapeChart.Fretboard.Style.width,
            height: 40},
        shapeChartGridMarginTop = 90,
        shapeChartGridPadding= {
            horizontal: 10,
            vertical: 5 },
        shapeChartGridMaxColumns=4,
        shapeChartGridWidth = shapeChartGridMaxColumns * (ShapeChart.Style.width + shapeChartGridPadding.horizontal) -
            shapeChartGridPadding.horizontal,
        topRowMarginTop = 20,
        generateButtonMarginRight=15,
        numChordsKey = "chord-jog-num-chords"
    ) => ({
        new: () => Module.of((
            numShapesInput = SVG.moveTo(
                SVG.Compositions.EnumInput.Number({
                    min: numChordsRange.min,
                    max: numChordsRange.max,
                    value: Module.of((
                        savedNumChords = localStorage.getItem(numChordsKey)
                    ) => {
                        if(savedNumChords !== null){
                            const parsedChords = Number.parseInt(savedNumChords);
                            return Number.isNaN(parsedChords) ? defaultNumChords : parsedChords;}
                        return defaultNumChords;}),
                    cellSize: numShapesInputCellSize,
                    changeListener: numChords => localStorage.setItem(numChordsKey, numChords)}),
                generateButtonSize.width + generateButtonMarginRight,
                .5 * (generateButtonSize.height - numShapesInputCellSize)),
            shapesGrid = SVG.yTo(
                SVG.Compositions.ModularGrid({
                    moduleSize: {
                        width: ShapeChart.Style.width,
                        height: ShapeChart.Style.height},
                    columns: 4,
                    padding: {
                        horizontal: shapeChartGridPadding.horizontal,
                        vertical: shapeChartGridPadding.vertical}}),
                shapeChartGridMarginTop),
            generateChords=()=>{
                const shapeIndices = [];
                const numChords = Math.min(numShapesInput.value, Shape.all.length);
                while(shapeIndices.length < numChords) {
                    const chordIndex = Numbers.randomIntegerInRange(0, Shape.all.length - 1);
                    if(! shapeIndices.includes(chordIndex)) {
                        shapeIndices.push(chordIndex);}}
                shapesGrid.modules = shapeIndices.map(shapeIndex => Module.of((
                    shape=Shape.all[shapeIndex]
                ) => Objects.withModification(
                    ShapeChart.Builder
                        .forSchema(shape.schema)
                        .fixed(Numbers.randomIntegerInRange(shape.range.min, shape.range.max)),
                    function() {
                        SVG.withAttribute(this.rootFretLabel, "font-weight", "bold");})))},
            topRow = SVG.Builder(SVG.G())
                .withClass("num-shapes-row")
                .withChild(SVG.Builder(SVG.G())
                    .withClass("num-shapes-row-content")
                    .withChild(SVG.Compositions.TextButton({
                        text: "Generate",
                        width: generateButtonSize.width,
                        height: generateButtonSize.height,
                        clickListener: generateChords}))
                    .withChild(numShapesInput)
                    .xTo(.5 * (Style.width - (
                        generateButtonSize.width +
                        generateButtonMarginRight +
                        (1 + numChordsRange.max - numChordsRange.min) * numShapesInputCellSize)))
                    .build())
                .yTo(topRowMarginTop)
                .build()
        ) => {
            generateChords();
            return Objects.withMethod(
                SVG.Builder(SVG.G())
                    .withClass("shapes-generator")
                    .withChild(topRow)
                    .withChild(shapesGrid)
                    .build(),
                "regenerate",
                generateChords);})}));

    const NavigationBar = Module.of((
        activePageKey = "chord-jog-active-page",
        startY=20,
        height=24,
        marginBottom=10,
        moduleWidth=95,
        fontSize=18,
        padding=30
    ) => ({
        Style: {
            endY: startY + .5*height,
            marginBottom: marginBottom},
        new: () => Module.of((
            application=undefined,
            activeButton=null,
            activePageName=null,
            buttonLinks = {},
            getPage=name=>buttonLinks[name].page,
            getActivePage=()=>getPage(activePageName),
            setActive=name=>{
                //Toggle active button
                if(activeButton !== null) {
                    SVG.withModification(
                        activeButton,
                        function() {
                            SVG.withTextDecoration(this.label, "none");
                            SVG.Compositions.MouseRegion.enable(this.mouseRegion);});}
                activeButton = SVG.withModification(
                    buttonLinks[name].button,
                    function() {
                        SVG.Compositions.ActionText.active(this);
                        SVG.Compositions.MouseRegion.disable(this.mouseRegion);});
                //Toggle active page
                if(activePageName !== null) {
                    SVG.withoutChild(application, getActivePage());}
                SVG.withChild(application, getPage(name));
                activePageName = name;

                //Save active page to local storage
                localStorage.setItem(activePageKey, name);}
        ) => Objects.withMethods(
            SVG.Builder(
                SVG.Compositions.ModularGrid({
                    moduleSize: {
                        width: moduleWidth,
                        height: height},
                    alignment: {
                        horizontal: "center"},
                    columns: 0,
                    padding: {
                        horizontal: padding,
                        vertical: 0}}))
                .withClass("navigation-bar")
                .yTo(startY)
                .build(),
            {
                setApplication: app => application = app,
                forApplication: function(application) {
                    this.setApplication(application);
                    return this;},
                hasPage: name => buttonLinks[name] !== undefined,
                addPage: function(name, page) {
                    const button = SVG.withModification(
                        SVG.Compositions.ActionText({
                            text: name,
                            width: moduleWidth,
                            height: height,
                            clickListener: () => setActive(name)}),
                        function() {
                            SVG.withFontSize(this.label, fontSize);});
                    buttonLinks[name] = {
                        button: button,
                        page: page };
                    this.columns = this.modules.length+1;
                    this.modules = this.modules.concat(button);
                    SVG.xTo(this,
                        .5*(Style.width - this.modules.length * moduleWidth - (this.modules.length - 1) * padding));},
                withPage: function(page, name) {
                    this.addPage(page, name);
                    return this;},
                activatePage: setActive,
                withActivatePageInLocalStorage: function(defaultPage) {
                    const activePage = localStorage.getItem(activePageKey);
                    if(activePage !== null && this.hasPage(activePage)) {
                        this.activatePage(activePage);}
                    else {
                        this.activatePage(defaultPage);}
                    return this;},
                withActivePage: function(name) {
                    setActive(name);
                    return this;}}))}));

    chordJogApp = Module.of((
        navigationBar = NavigationBar.new(),
        pages={
            Generate: ShapesGenerator.new(),
            Library: ShapesLibrary.new()},
        addPage=(name, content)=>navigationBar
            .withPage(name, SVG.yTo(content, NavigationBar.Style.endY + NavigationBar.Style.marginBottom)),
        addPages=Object.entries(pages).forEach(page => addPage(page[0], page[1]))
    ) => SVG.Builder(SVG.SVG())
        .withClass("chord-jog-app")
        .withAttributes({
            width: Style.width,
            height: Style.height,
            fill: "none",
            stroke: Style.colors.heavy,
            strokeWidth: Style.stroke.width,
            strokeLinecap: "round"})
        .disableTextSelection()
        .withChild(navigationBar)
        .withModification(function() {
            navigationBar
                .forApplication(this)
                .withActivatePageInLocalStorage("Generate");})
        .withModification(() => Shape.all.length === 0 ?
            Shape.downloadStandardLibrary().then(shapes => {
                Shape.replaceAll(shapes);
                pages.Generate.regenerate();
                pages.Library.refresh();}) : undefined)
        .build());
    return {
        create: () => chordJogApp};})();