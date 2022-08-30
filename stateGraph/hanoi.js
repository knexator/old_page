"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/denque/index.js
  var require_denque = __commonJS({
    "node_modules/denque/index.js"(exports, module) {
      "use strict";
      function Denque2(array, options) {
        var options = options || {};
        this._capacity = options.capacity;
        this._head = 0;
        this._tail = 0;
        if (Array.isArray(array)) {
          this._fromArray(array);
        } else {
          this._capacityMask = 3;
          this._list = new Array(4);
        }
      }
      Denque2.prototype.peekAt = function peekAt(index) {
        var i = index;
        if (i !== (i | 0)) {
          return void 0;
        }
        var len = this.size();
        if (i >= len || i < -len)
          return void 0;
        if (i < 0)
          i += len;
        i = this._head + i & this._capacityMask;
        return this._list[i];
      };
      Denque2.prototype.get = function get(i) {
        return this.peekAt(i);
      };
      Denque2.prototype.peek = function peek() {
        if (this._head === this._tail)
          return void 0;
        return this._list[this._head];
      };
      Denque2.prototype.peekFront = function peekFront() {
        return this.peek();
      };
      Denque2.prototype.peekBack = function peekBack() {
        return this.peekAt(-1);
      };
      Object.defineProperty(Denque2.prototype, "length", {
        get: function length() {
          return this.size();
        }
      });
      Denque2.prototype.size = function size() {
        if (this._head === this._tail)
          return 0;
        if (this._head < this._tail)
          return this._tail - this._head;
        else
          return this._capacityMask + 1 - (this._head - this._tail);
      };
      Denque2.prototype.unshift = function unshift(item) {
        if (arguments.length === 0)
          return this.size();
        var len = this._list.length;
        this._head = this._head - 1 + len & this._capacityMask;
        this._list[this._head] = item;
        if (this._tail === this._head)
          this._growArray();
        if (this._capacity && this.size() > this._capacity)
          this.pop();
        if (this._head < this._tail)
          return this._tail - this._head;
        else
          return this._capacityMask + 1 - (this._head - this._tail);
      };
      Denque2.prototype.shift = function shift() {
        var head = this._head;
        if (head === this._tail)
          return void 0;
        var item = this._list[head];
        this._list[head] = void 0;
        this._head = head + 1 & this._capacityMask;
        if (head < 2 && this._tail > 1e4 && this._tail <= this._list.length >>> 2)
          this._shrinkArray();
        return item;
      };
      Denque2.prototype.push = function push(item) {
        if (arguments.length === 0)
          return this.size();
        var tail = this._tail;
        this._list[tail] = item;
        this._tail = tail + 1 & this._capacityMask;
        if (this._tail === this._head) {
          this._growArray();
        }
        if (this._capacity && this.size() > this._capacity) {
          this.shift();
        }
        if (this._head < this._tail)
          return this._tail - this._head;
        else
          return this._capacityMask + 1 - (this._head - this._tail);
      };
      Denque2.prototype.pop = function pop() {
        var tail = this._tail;
        if (tail === this._head)
          return void 0;
        var len = this._list.length;
        this._tail = tail - 1 + len & this._capacityMask;
        var item = this._list[this._tail];
        this._list[this._tail] = void 0;
        if (this._head < 2 && tail > 1e4 && tail <= len >>> 2)
          this._shrinkArray();
        return item;
      };
      Denque2.prototype.removeOne = function removeOne(index) {
        var i = index;
        if (i !== (i | 0)) {
          return void 0;
        }
        if (this._head === this._tail)
          return void 0;
        var size = this.size();
        var len = this._list.length;
        if (i >= size || i < -size)
          return void 0;
        if (i < 0)
          i += size;
        i = this._head + i & this._capacityMask;
        var item = this._list[i];
        var k;
        if (index < size / 2) {
          for (k = index; k > 0; k--) {
            this._list[i] = this._list[i = i - 1 + len & this._capacityMask];
          }
          this._list[i] = void 0;
          this._head = this._head + 1 + len & this._capacityMask;
        } else {
          for (k = size - 1 - index; k > 0; k--) {
            this._list[i] = this._list[i = i + 1 + len & this._capacityMask];
          }
          this._list[i] = void 0;
          this._tail = this._tail - 1 + len & this._capacityMask;
        }
        return item;
      };
      Denque2.prototype.remove = function remove(index, count) {
        var i = index;
        var removed;
        var del_count = count;
        if (i !== (i | 0)) {
          return void 0;
        }
        if (this._head === this._tail)
          return void 0;
        var size = this.size();
        var len = this._list.length;
        if (i >= size || i < -size || count < 1)
          return void 0;
        if (i < 0)
          i += size;
        if (count === 1 || !count) {
          removed = new Array(1);
          removed[0] = this.removeOne(i);
          return removed;
        }
        if (i === 0 && i + count >= size) {
          removed = this.toArray();
          this.clear();
          return removed;
        }
        if (i + count > size)
          count = size - i;
        var k;
        removed = new Array(count);
        for (k = 0; k < count; k++) {
          removed[k] = this._list[this._head + i + k & this._capacityMask];
        }
        i = this._head + i & this._capacityMask;
        if (index + count === size) {
          this._tail = this._tail - count + len & this._capacityMask;
          for (k = count; k > 0; k--) {
            this._list[i = i + 1 + len & this._capacityMask] = void 0;
          }
          return removed;
        }
        if (index === 0) {
          this._head = this._head + count + len & this._capacityMask;
          for (k = count - 1; k > 0; k--) {
            this._list[i = i + 1 + len & this._capacityMask] = void 0;
          }
          return removed;
        }
        if (i < size / 2) {
          this._head = this._head + index + count + len & this._capacityMask;
          for (k = index; k > 0; k--) {
            this.unshift(this._list[i = i - 1 + len & this._capacityMask]);
          }
          i = this._head - 1 + len & this._capacityMask;
          while (del_count > 0) {
            this._list[i = i - 1 + len & this._capacityMask] = void 0;
            del_count--;
          }
          if (index < 0)
            this._tail = i;
        } else {
          this._tail = i;
          i = i + count + len & this._capacityMask;
          for (k = size - (count + index); k > 0; k--) {
            this.push(this._list[i++]);
          }
          i = this._tail;
          while (del_count > 0) {
            this._list[i = i + 1 + len & this._capacityMask] = void 0;
            del_count--;
          }
        }
        if (this._head < 2 && this._tail > 1e4 && this._tail <= len >>> 2)
          this._shrinkArray();
        return removed;
      };
      Denque2.prototype.splice = function splice(index, count) {
        var i = index;
        if (i !== (i | 0)) {
          return void 0;
        }
        var size = this.size();
        if (i < 0)
          i += size;
        if (i > size)
          return void 0;
        if (arguments.length > 2) {
          var k;
          var temp;
          var removed;
          var arg_len = arguments.length;
          var len = this._list.length;
          var arguments_index = 2;
          if (!size || i < size / 2) {
            temp = new Array(i);
            for (k = 0; k < i; k++) {
              temp[k] = this._list[this._head + k & this._capacityMask];
            }
            if (count === 0) {
              removed = [];
              if (i > 0) {
                this._head = this._head + i + len & this._capacityMask;
              }
            } else {
              removed = this.remove(i, count);
              this._head = this._head + i + len & this._capacityMask;
            }
            while (arg_len > arguments_index) {
              this.unshift(arguments[--arg_len]);
            }
            for (k = i; k > 0; k--) {
              this.unshift(temp[k - 1]);
            }
          } else {
            temp = new Array(size - (i + count));
            var leng = temp.length;
            for (k = 0; k < leng; k++) {
              temp[k] = this._list[this._head + i + count + k & this._capacityMask];
            }
            if (count === 0) {
              removed = [];
              if (i != size) {
                this._tail = this._head + i + len & this._capacityMask;
              }
            } else {
              removed = this.remove(i, count);
              this._tail = this._tail - leng + len & this._capacityMask;
            }
            while (arguments_index < arg_len) {
              this.push(arguments[arguments_index++]);
            }
            for (k = 0; k < leng; k++) {
              this.push(temp[k]);
            }
          }
          return removed;
        } else {
          return this.remove(i, count);
        }
      };
      Denque2.prototype.clear = function clear() {
        this._list = new Array(this._list.length);
        this._head = 0;
        this._tail = 0;
      };
      Denque2.prototype.isEmpty = function isEmpty() {
        return this._head === this._tail;
      };
      Denque2.prototype.toArray = function toArray() {
        return this._copyArray(false);
      };
      Denque2.prototype._fromArray = function _fromArray(array) {
        var length = array.length;
        var capacity = this._nextPowerOf2(length);
        this._list = new Array(capacity);
        this._capacityMask = capacity - 1;
        this._tail = length;
        for (var i = 0; i < length; i++)
          this._list[i] = array[i];
      };
      Denque2.prototype._copyArray = function _copyArray(fullCopy, size) {
        var src = this._list;
        var capacity = src.length;
        var length = this.length;
        size = size | length;
        if (size == length && this._head < this._tail) {
          return this._list.slice(this._head, this._tail);
        }
        var dest = new Array(size);
        var k = 0;
        var i;
        if (fullCopy || this._head > this._tail) {
          for (i = this._head; i < capacity; i++)
            dest[k++] = src[i];
          for (i = 0; i < this._tail; i++)
            dest[k++] = src[i];
        } else {
          for (i = this._head; i < this._tail; i++)
            dest[k++] = src[i];
        }
        return dest;
      };
      Denque2.prototype._growArray = function _growArray() {
        if (this._head != 0) {
          var newList = this._copyArray(true, this._list.length << 1);
          this._tail = this._list.length;
          this._head = 0;
          this._list = newList;
        } else {
          this._tail = this._list.length;
          this._list.length <<= 1;
        }
        this._capacityMask = this._capacityMask << 1 | 1;
      };
      Denque2.prototype._shrinkArray = function _shrinkArray() {
        this._list.length >>>= 1;
        this._capacityMask >>>= 1;
      };
      Denque2.prototype._nextPowerOf2 = function _nextPowerOf2(num) {
        var log2 = Math.log(num) / Math.log(2);
        var nextPow2 = 1 << log2 + 1;
        return Math.max(nextPow2, 4);
      };
      module.exports = Denque2;
    }
  });

  // node_modules/geneticalgorithm/index.js
  var require_geneticalgorithm = __commonJS({
    "node_modules/geneticalgorithm/index.js"(exports, module) {
      module.exports = function geneticAlgorithmConstructor(options) {
        function settingDefaults() {
          return {
            mutationFunction: function(phenotype) {
              return phenotype;
            },
            crossoverFunction: function(a, b) {
              return [a, b];
            },
            fitnessFunction: function(phenotype) {
              return 0;
            },
            doesABeatBFunction: void 0,
            population: [],
            populationSize: 100
          };
        }
        function settingWithDefaults(settings2, defaults) {
          settings2 = settings2 || {};
          settings2.mutationFunction = settings2.mutationFunction || defaults.mutationFunction;
          settings2.crossoverFunction = settings2.crossoverFunction || defaults.crossoverFunction;
          settings2.fitnessFunction = settings2.fitnessFunction || defaults.fitnessFunction;
          settings2.doesABeatBFunction = settings2.doesABeatBFunction || defaults.doesABeatBFunction;
          settings2.population = settings2.population || defaults.population;
          if (settings2.population.length <= 0)
            throw Error("population must be an array and contain at least 1 phenotypes");
          settings2.populationSize = settings2.populationSize || defaults.populationSize;
          if (settings2.populationSize <= 0)
            throw Error("populationSize must be greater than 0");
          return settings2;
        }
        var settings = settingWithDefaults(options, settingDefaults());
        function populate() {
          var size = settings.population.length;
          while (settings.population.length < settings.populationSize) {
            settings.population.push(
              mutate(
                cloneJSON(settings.population[Math.floor(Math.random() * size)])
              )
            );
          }
        }
        function cloneJSON(object) {
          return JSON.parse(JSON.stringify(object));
        }
        function mutate(phenotype) {
          return settings.mutationFunction(cloneJSON(phenotype));
        }
        function crossover(phenotype) {
          phenotype = cloneJSON(phenotype);
          var mate = settings.population[Math.floor(Math.random() * settings.population.length)];
          mate = cloneJSON(mate);
          return settings.crossoverFunction(phenotype, mate)[0];
        }
        function doesABeatB(a, b) {
          var doesABeatB2 = false;
          if (settings.doesABeatBFunction) {
            return settings.doesABeatBFunction(a, b);
          } else {
            return settings.fitnessFunction(a) >= settings.fitnessFunction(b);
          }
        }
        function compete() {
          var nextGeneration = [];
          for (var p = 0; p < settings.population.length - 1; p += 2) {
            var phenotype = settings.population[p];
            var competitor = settings.population[p + 1];
            nextGeneration.push(phenotype);
            if (doesABeatB(phenotype, competitor)) {
              if (Math.random() < 0.5) {
                nextGeneration.push(mutate(phenotype));
              } else {
                nextGeneration.push(crossover(phenotype));
              }
            } else {
              nextGeneration.push(competitor);
            }
          }
          settings.population = nextGeneration;
        }
        function randomizePopulationOrder() {
          for (var index = 0; index < settings.population.length; index++) {
            var otherIndex = Math.floor(Math.random() * settings.population.length);
            var temp = settings.population[otherIndex];
            settings.population[otherIndex] = settings.population[index];
            settings.population[index] = temp;
          }
        }
        return {
          evolve: function(options2) {
            if (options2) {
              settings = settingWithDefaults(options2, settings);
            }
            populate();
            randomizePopulationOrder();
            compete();
            return this;
          },
          best: function() {
            var scored = this.scoredPopulation();
            var result = scored.reduce(function(a, b) {
              return a.score >= b.score ? a : b;
            }, scored[0]).phenotype;
            return cloneJSON(result);
          },
          bestScore: function() {
            return settings.fitnessFunction(this.best());
          },
          population: function() {
            return cloneJSON(this.config().population);
          },
          scoredPopulation: function() {
            return this.population().map(function(phenotype) {
              return {
                phenotype: cloneJSON(phenotype),
                score: settings.fitnessFunction(phenotype)
              };
            });
          },
          config: function() {
            return cloneJSON(settings);
          },
          clone: function(options2) {
            return geneticAlgorithmConstructor(
              settingWithDefaults(
                options2,
                settingWithDefaults(this.config(), settings)
              )
            );
          }
        };
      };
    }
  });

  // node_modules/simulated-annealing/index.js
  var require_simulated_annealing = __commonJS({
    "node_modules/simulated-annealing/index.js"(exports, module) {
      module.exports = function({
        initialState,
        tempMax,
        tempMin,
        newState,
        getTemp,
        getEnergy
      } = {}) {
        if (!isFunction(newState)) {
          throw new Error("newState is not function.");
        }
        if (!isFunction(getTemp)) {
          throw new Error("getTemp is not function.");
        }
        if (!isFunction(getEnergy)) {
          throw new Error("getEnergy is not function.");
        }
        var currentTemp = tempMax;
        var lastState = initialState;
        var lastEnergy = getEnergy(lastState);
        var bestState = lastState;
        var bestEnergy = lastEnergy;
        while (currentTemp > tempMin) {
          let currentState = newState(lastState);
          let currentEnergy = getEnergy(currentState);
          if (currentEnergy < lastEnergy) {
            lastState = currentState;
            lastEnergy = currentEnergy;
          } else {
            if (Math.random() <= Math.exp(-(currentEnergy - lastEnergy) / currentTemp)) {
              lastState = currentState;
              lastEnergy = currentEnergy;
            }
          }
          if (bestEnergy > lastEnergy) {
            bestState = lastState;
            bestEnergy = lastEnergy;
          }
          currentTemp = getTemp(currentTemp);
        }
        return bestState;
      };
      function isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === "[object Function]";
      }
    }
  });

  // helper.ts
  var import_denque = __toESM(require_denque());
  function generateAllPaths(initialState, getNextStates, getId) {
    let result = {};
    result[getId(initialState)] = {
      parent_id: null,
      parent_input: null,
      min_path_length: 0,
      state: initialState
    };
    let pending = new import_denque.default();
    pending.push(initialState);
    while (!pending.isEmpty()) {
      let curState = pending.shift();
      let stateId = getId(curState);
      let curResult = result[stateId];
      let nextStates2 = getNextStates(curState);
      for (const [cur_input, cur_nextState] of Object.entries(nextStates2)) {
        let nextStateId = getId(cur_nextState);
        if (nextStateId in result) {
          if (curResult.min_path_length + 1 < result[nextStateId].min_path_length) {
            result[nextStateId] = {
              parent_id: stateId,
              parent_input: cur_input,
              min_path_length: curResult.min_path_length + 1,
              state: cur_nextState
            };
          }
        } else {
          result[nextStateId] = {
            parent_id: stateId,
            parent_input: cur_input,
            min_path_length: curResult.min_path_length + 1,
            state: cur_nextState
          };
          pending.push(cur_nextState);
        }
      }
    }
    return result;
  }

  // node_modules/fast-sort/dist/sort.es.js
  var castComparer = function(comparer) {
    return function(a, b, order) {
      return comparer(a, b, order) * order;
    };
  };
  var throwInvalidConfigErrorIfTrue = function(condition, context) {
    if (condition)
      throw Error("Invalid sort config: " + context);
  };
  var unpackObjectSorter = function(sortByObj) {
    var _a = sortByObj || {}, asc = _a.asc, desc = _a.desc;
    var order = asc ? 1 : -1;
    var sortBy = asc || desc;
    throwInvalidConfigErrorIfTrue(!sortBy, "Expected `asc` or `desc` property");
    throwInvalidConfigErrorIfTrue(asc && desc, "Ambiguous object with `asc` and `desc` config properties");
    var comparer = sortByObj.comparer && castComparer(sortByObj.comparer);
    return { order, sortBy, comparer };
  };
  var multiPropertySorterProvider = function(defaultComparer2) {
    return function multiPropertySorter(sortBy, sortByArr, depth, order, comparer, a, b) {
      var valA;
      var valB;
      if (typeof sortBy === "string") {
        valA = a[sortBy];
        valB = b[sortBy];
      } else if (typeof sortBy === "function") {
        valA = sortBy(a);
        valB = sortBy(b);
      } else {
        var objectSorterConfig = unpackObjectSorter(sortBy);
        return multiPropertySorter(objectSorterConfig.sortBy, sortByArr, depth, objectSorterConfig.order, objectSorterConfig.comparer || defaultComparer2, a, b);
      }
      var equality = comparer(valA, valB, order);
      if ((equality === 0 || valA == null && valB == null) && sortByArr.length > depth) {
        return multiPropertySorter(sortByArr[depth], sortByArr, depth + 1, order, comparer, a, b);
      }
      return equality;
    };
  };
  function getSortStrategy(sortBy, comparer, order) {
    if (sortBy === void 0 || sortBy === true) {
      return function(a, b) {
        return comparer(a, b, order);
      };
    }
    if (typeof sortBy === "string") {
      throwInvalidConfigErrorIfTrue(sortBy.includes("."), "String syntax not allowed for nested properties.");
      return function(a, b) {
        return comparer(a[sortBy], b[sortBy], order);
      };
    }
    if (typeof sortBy === "function") {
      return function(a, b) {
        return comparer(sortBy(a), sortBy(b), order);
      };
    }
    if (Array.isArray(sortBy)) {
      var multiPropSorter_1 = multiPropertySorterProvider(comparer);
      return function(a, b) {
        return multiPropSorter_1(sortBy[0], sortBy, 1, order, comparer, a, b);
      };
    }
    var objectSorterConfig = unpackObjectSorter(sortBy);
    return getSortStrategy(objectSorterConfig.sortBy, objectSorterConfig.comparer || comparer, objectSorterConfig.order);
  }
  var sortArray = function(order, ctx, sortBy, comparer) {
    var _a;
    if (!Array.isArray(ctx)) {
      return ctx;
    }
    if (Array.isArray(sortBy) && sortBy.length < 2) {
      _a = sortBy, sortBy = _a[0];
    }
    return ctx.sort(getSortStrategy(sortBy, comparer, order));
  };
  function createNewSortInstance(opts) {
    var comparer = castComparer(opts.comparer);
    return function(_ctx) {
      var ctx = Array.isArray(_ctx) && !opts.inPlaceSorting ? _ctx.slice() : _ctx;
      return {
        asc: function(sortBy) {
          return sortArray(1, ctx, sortBy, comparer);
        },
        desc: function(sortBy) {
          return sortArray(-1, ctx, sortBy, comparer);
        },
        by: function(sortBy) {
          return sortArray(1, ctx, sortBy, comparer);
        }
      };
    };
  }
  var defaultComparer = function(a, b, order) {
    if (a == null)
      return order;
    if (b == null)
      return -order;
    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  };
  var sort = createNewSortInstance({
    comparer: defaultComparer
  });
  var inPlaceSort = createNewSortInstance({
    comparer: defaultComparer,
    inPlaceSorting: true
  });

  // hanoi.ts
  var genetics = __toESM(require_geneticalgorithm());
  var annealing = __toESM(require_simulated_annealing());
  var simulatedAnnealing = annealing.default;
  function walkthroughToCoolestStateOfMagicTable(localTable) {
    let paths = generateAllPaths(
      {
        poles: [
          {
            contents: [5, 4, 3, 2, 1]
          },
          { contents: [] },
          { contents: [] }
        ]
      },
      (state) => nextStates(state, localTable),
      hanoiId
    );
    let coolest_state = sort(Object.values(paths)).asc(({ state, min_path_length }) => {
      if (state.poles[2].contents.length !== 5)
        return null;
      return min_path_length;
    })[0];
    let coolest_path = [];
    let curStateId = hanoiId(coolest_state.state);
    while (true) {
      let prevStateId = paths[curStateId].parent_id;
      if (prevStateId !== null) {
        coolest_path.push(paths[curStateId].parent_input);
        curStateId = prevStateId;
      } else {
        break;
      }
    }
    coolest_path.reverse();
    return coolest_path;
  }
  function canItemStackOnItem(itemHigh, itemLow, dataTable) {
    return dataTable[itemLow - 1][itemHigh - 1] === 1;
  }
  function nextStates(state, thingyTable) {
    let result = {};
    state.poles.forEach((from, fromIndex) => {
      state.poles.forEach((to, toIndex) => {
        if (to === from)
          return;
        if (from.contents.length === 0)
          return;
        let valid = false;
        if (to.contents.length === 0) {
          valid = true;
        } else {
          valid = canItemStackOnItem(from.contents.at(-1), to.contents.at(-1), thingyTable);
        }
        if (valid) {
          let newState = JSON.parse(JSON.stringify(state));
          newState.poles[toIndex].contents.push(
            newState.poles[fromIndex].contents.pop()
          );
          result[`${fromIndex}->${toIndex}`] = newState;
        }
      });
    });
    return result;
  }
  function hanoiId(state) {
    return state.poles.map((places, placesIndex) => {
      return `${placesIndex}: [${places.contents.map((x) => x.toString()).join(", ")}]`;
    }).join("\n");
  }
  var N_DISKS = 5;
  var magicTable = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [1, 1, 1, 1, 0]
  ];
  var button_div = document.getElementById("buttons");
  var button_elements = [];
  for (let row = 0; row < N_DISKS; row++) {
    let cur_row = document.createElement("div");
    let cur_row_buttons = [];
    for (let col = 0; col < N_DISKS; col++) {
      let cur_button = document.createElement("input");
      cur_button.type = "checkbox";
      cur_button.checked = magicTable[row][col] === 1;
      cur_button.id = `${col}_${row}`;
      cur_button.addEventListener("change", (ev) => {
        magicTable[row][col] = cur_button.checked ? 1 : 0;
        recalcScore();
      });
      cur_row.appendChild(cur_button);
      cur_row_buttons.push(cur_button);
    }
    button_div.appendChild(cur_row);
    button_elements.push(cur_row_buttons);
  }
  var result_div = document.getElementById("result");
  function recalcScore() {
    let stuff = walkthroughToCoolestStateOfMagicTable(magicTable);
    result_div.innerText = `${stuff.length.toString()}: ${stuff.join(" ; ")}`;
  }
  function mutateTable(table) {
    let newTable = JSON.parse(JSON.stringify(table));
    for (let k = 0; k < 4; k++) {
      let rand_row = Math.floor(Math.random() * N_DISKS);
      let rand_col = Math.floor(Math.random() * N_DISKS);
      while (rand_col === rand_row || rand_col + 1 === rand_row) {
        rand_row = Math.floor(Math.random() * N_DISKS);
        rand_col = Math.floor(Math.random() * N_DISKS);
      }
      newTable[rand_row][rand_col] = 1 - newTable[rand_row][rand_col];
    }
    return newTable;
  }
  var evolve_button = document.getElementById("evolve");
  evolve_button.addEventListener("click", (ev) => {
    magicTable = simulatedAnnealing({
      initialState: magicTable,
      tempMax: 15,
      tempMin: 1e-3,
      newState: mutateTable,
      getTemp: (temp) => temp - 1e-3,
      getEnergy: (state) => {
        let solution = walkthroughToCoolestStateOfMagicTable(state);
        return -solution.length;
      }
    });
    for (let row = 0; row < N_DISKS; row++) {
      for (let col = 0; col < N_DISKS; col++) {
        button_elements[row][col].checked = magicTable[row][col] === 1;
      }
    }
    recalcScore();
  });
})();
