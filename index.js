/**
 * Auto-loads the User and Role models based on the configuration.
 * @author: Cliff
 * @since:  8/31/2015
 * */

/**
 * Calls model.findOrCreate() on each array element.
 * @param {Object} curVal Current array element to be processed.
 * @param {string} curVal.name
 */
var addUserRole = function ( curVal ) {
  return this.findOrCreate( { 'name': curVal.name }, curVal )
    .then(
    function ( instance ) {
      return instance[0];
    }
  );
}

/**
 * Takes care of adding or updating a model with one or more items
 * @param {Object}    Model Appication model to be updated.
 * @param {Function}  Model.upsert Model supports upsert()
 * @param {Function}  Model.findOrCreate Model supports findOrCreate()
 * @param {Object[])  data Array of items to add to the model
 * @param {boolean}   [overwrite=False] True=Update model even if already exists.
 * @returns {[]|Object} An array of 1 or more promises.
 */
var addUpdateModel = function ( Model, data, overwrite ) {
  var result = Array();

  /* Use Model.upsert to overwrite existing Model items */
  if ( overwrite ) {
    result = data.map( Model.upsert )
  } else {
    result = data.map( addUserRole, Model )
  }

  return result;
  /* An array of Promises */
}

/**
 * Adds RoleMappings based on the mapping array
 * @param {Object}   Model Loopback Model to be updated
 * @param {Object[]} mapping Array of role mappings
 * @param {Object[]} users Array of users from Users model
 * @param {Object[]} roles Array of roles from Roles model
 */
var addRoleMapping = function ( Model, mapping, users, roles ) {
  var result = Array();

  /**
   * Searches an array for a property that equals a string value.
   * Returns the array row, if a match is found. Otherwise, null is returned.
   * @param {Object[]} data Data array to be searched
   * @param {string}   prop Property name to use incomparison
   * @param {string}   value Value being searched for.
   * @returns {Object|null}
   */
  var findItem = function (data, prop, value) {
    for (var idx=0; idx < data.length; ++idx) {
      if (data[idx][prop] === value) {
        return data[idx];
      }
    }
    return null;
  }

  /**
   * Creates a RoleMapping from the map object.
   * @param {Object} map Mapping object
   * @param {string} map.user Username of User to be mapped
   * @param {string} map.role Name of Role for User to be mapped to
   * @returns {Promise|null}
   */
  var createMapping = function (map) {
    /* Find user & role first */
    var user = findItem(users, 'username', map.user);
    var role = findItem(roles, 'name', map.role);

    if (user && role) {
      return role.principals.create(
        {
          principalType: Model.USER,
          principalId:   user.id
        }
      );
    }
    return null;
  }

  /* if ANY array is empty, there's no sense in trying to map roles */
  if (mapping && mapping.length && users && users.length && roles && roles.length) {
    result = mapping.map(createMapping);
  }
  return result;
}

/**
 * @param {Object}   config Configuration object
 * @param {boolean}  [config.overwrite] True=Overwrite existing (defaults to False)
 * @param {Object}   [config.User] Configuration object for User model
 * @param {string}   [config.User.model] Name of model (defaults to 'User')
 * @param {Object[]} config.User.data Array of users
 * @param {string}   config.User.data[].name Name of the user
 * @param {string}   config.User.data[].description Optinoal description of the user
 * @param {Object}   [config.Role] Configuration object for Role model
 * @param {string}   [config.Role.model] Optional name of model (defaults to 'Role')
 * @param {Object[]} config.Role.data Array of role
 * @param {string}   config.Role.data[].name Name of the role
 * @param {string}   config.Role.data[].description Optinoal description of the role
 * @param {Object}   [config.RoleMapping] Configuration object for RoleMapping model
 * @param {string}   [config.RoleMapping.model] Optional name of model (defaults to 'RoleMapping')
 * @return {Promise}
 * */
module.exports = function ( app, config ) {
  var User        = ( (config.User && config.User.model) ? app.loopback.findModel(config.User.model) : app.models.User );
  var Role        = ( (config.Role && config.Role.model) ? app.loopback.findModel( config.Role.model ) : app.models.Role );
  var RoleMapping = ( (config.RoleMapping && config.RoleMapping.model) ? app.findModel( config.RoleMapping.model )
                  : app.models.RoleMapping );
  var promiseRoles= Array();

  /* Create array of promises from Role.data */
  if (config.Role && config.Role.data) {
    promiseRoles = addUpdateModel(Role, config.Role.data, config.overwrite);
  }

  return Promise.all(promiseRoles) // Create all roles
    .then( // Construct Users
    function ( roles ) {
      promiseRoles = roles;
      /* Now make sure all the static Users are created as necessary */
      if ( config.User && config.User.data ) {
        return Promise.all( addUpdateModel( User, config.User.data, config.overwrite ) );
      }
      return null;
    } )
    .then(// Construct Role Mappings
    function ( users ) {
      return Promise.all(addRoleMapping( RoleMapping, config.RoleMapping.data, users, promiseRoles ));
    } )
    .catch(
    function ( err ) {
      throw (err);
    } );

};