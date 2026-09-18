UserList

- page use use a query fetchAllUSers

Group Details

- Verify the fetch size so we don't fetch with hardcoded limits

Make sure ENTER key works on Modal Forms

make sure the status in tables are well defined, currently are not even aligned

when table in modal, the height is changing, it should be static

Verify what actions are prohibited for the admin user

when user is assigned to group then the only queries invalidated should be the list of users assigned to the user, not all queries

when objects have id discovered already, we should create a new type WithId<T, {id}>
