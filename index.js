var documentWrappers = {};

var wrapDocument = function(doc) {
  var wrapperFunc = documentWrappers[doc.type];

  if (!wrapperFunc) {
    wrapperFunc = createContainerWrapper(doc);
    // documentWrappers[doc.type] = wrapperFunc; // TODO: Fix caching.
  }

  return new wrapperFunc(doc);
};

var wrapDocuments = function(docs) {
  var wrapped = [];

  for (index in docs) {
    wrapped.push(wrapDocument(docs[index]));
  }

  return wrapped;
}

var createContainerWrapper = function(container) {
  var wrapper = function(container, loadedDocuments) {
    this.container = container;
    this.loadedDocuments = loadedDocuments || container.loadedDocuments;
  };

  wrapper.prototype.id = function() {
    return this.container.id;
  }

  for (keyname in container.fragments) {
    var fieldName = keyname.split('.').slice(-1)[0]; // last slug in path
    var fieldMethodName = 'get' + UCFirstEach(fieldName.split('_')).join(''); // content => getContent
    var fragmentType = container.fragments[keyname].type;

    wrapper.prototype[fieldMethodName] = createFragmentWrapper(keyname, fragmentType);
  }

  return wrapper;
};

var createContainerWrappers = function(containers, loadedDocuments) {
  if (containers.length == 0) {
    return [];
  }

  var sample = containers.slice(-1)[0];
  var template = createContainerWrapper(sample);
  var wrappers = [];

  for (index in containers) {
    wrappers.push(new template(containers[index], loadedDocuments));
  }

  return wrappers;
};

var createFragmentWrapper = function(path, type) {
  var mainType = type.split('.').slice(0)[0];
  var callingMethod = 'get'+ mainType;
  var resolvedFragment = null;

  return function() {
    if (resolvedFragment == null || true) { // TODO: fix caching bug
      var method = this.container[callingMethod];
      var fragment = method.call(this.container, path);

      if (mainType === 'Group') { // return wrapped fragments
        fragment = fragment? fragment.toArray() : [];

        if (fragment.length) {
          fragment = createContainerWrappers(fragment, this.container.loadedDocuments);
        }
      }

      if (mainType === 'Link') { // try to return wrapped object
        var id = fragment.document.id;

        if (this.loadedDocuments[id]) {
          fragment = wrapDocument(this.loadedDocuments[id]);
        }
      }

      resolvedFragment = fragment;
    }

    return resolvedFragment;
  };
};

// helper
var UCFirstEach = function(strings) {
  var results = [];

  for (var i = 0; i < strings.length; i++) {
    results.push(strings[i][0].toUpperCase() + strings[i].slice(1));
  }

  return results;
}

var potato = {
  wrapDocument: function(doc) {
    return wrapDocument(doc);
  },
  wrapDocuments: function(docs) {
    return wrapDocuments(docs);
  }
};

module.exports = potato;
