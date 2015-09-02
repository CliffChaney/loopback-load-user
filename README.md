# loopback-load-user, Configuration based module to auto-load static users
This module is used with Loopback to handle the creation of static users, roles and role mappings. Can easily work
with extended models.

## Example
Simply pass the Loopback app and a configuration object to the module. This would normally be done
from a Loopback boot script (e.g. .\server\boot\loaduser.js)

``` js

// Some module in the .\server\boot folder
module.exports = function ( app ) {
  var loadUser = require("loopback-load-user");
  
  // Create an Admin Role
  // Create a User named 'some-user'
  // Map 'some-user' to the Admin Role.
  loadUser(app,
    {
      'Role': {
        'data': [
          {
            'name': 'Admin',
            'description': 'Can do anything!'
          }
        ]
      },
      'User': {
        'data': [
          {
            'username': 'some-user',
            'password': 'default'
          }
        ]
      },
      'RoleMapping': {
        'data': [
          {
            'user': 'some-user',
            'role': 'Admin'
          }
        ]
      }
    

```
## Configuration

### Role
Describes the roles to be automatically created

### Role.model
Name of the app.model to be updated with role data. Defaults to 'Role'.

### Role.data
Array of role items to be inserted or updated in the Role model. Note that the _name_ property of
each role must be specified. Other than _name_, any other property supported by the model schema
is allowed.

### Role.data[].name
Name of the role to be added to the Role model.

### User
Describes the users to be automatically created

### User.model
Name of the app.model to be updated with user data. Defaults to 'User'.

### User.data
Array of user items to be inserted or updated in the User model. Note that the _username_ property of
each role must be specified. Other than _username_, any other property supported by the model schema
is allowed.

### User.data[].username
Name of the user to be added to the User model.

### overwrite
Set to _true_ in order to force users and roles to be updated, even if they already exist.

By default (i.e. overwrite=_false_), rows are only added if they do not previously exist.

## To Be Added
- Add Test Scripts
- Consider extending to load any Loopback Model with static data
