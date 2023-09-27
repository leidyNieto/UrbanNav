import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {User, UserRelations, Login} from '../models';
import {LoginRepository} from './login.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype._id,
  UserRelations
> {

  public readonly logins: HasManyRepositoryFactory<Login, typeof User.prototype._id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource, @repository.getter('LoginRepository') protected loginRepositoryGetter: Getter<LoginRepository>,
  ) {
    super(User, dataSource);
    this.logins = this.createHasManyRepositoryFactoryFor('logins', loginRepositoryGetter,);
    this.registerInclusionResolver('logins', this.logins.inclusionResolver);
  }
}
