import { Category } from './category.model';

export class Pet {
  id: number;
  name: string;
  category: Category;
  photoUrls: string[];
  tags: string[];
  status: string;

  constructor(source: any = {}) {
    Object.assign(this, source);
  }
}
