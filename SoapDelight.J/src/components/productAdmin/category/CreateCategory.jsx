import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {createCategory} from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice'
import { toast } from 'react-toastify';

const CreateCategory = ({reloadCategory}) => {
    const [name, setName] = useState("");

    const { isLoading } = useSelector((state) => state.category);
    const dispatch = useDispatch();
    const isSuccess = useSelector((state) => state.category.isSuccess);
    const message = useSelector((state) => state.category.message);

    const saveCategory = async (e) => {
        e.preventDefault();
        // console.log(name);
        if (name.length < 3) {
          return toast.error("分類名稱至少需要 3 個字元");
        }
        const formData = {
          name,
        };
        // console.log(formData);
        await dispatch(createCategory(formData));
        // dispatch(getCategories());
        setName("");
        reloadCategory();
        
      };

  return (
    <>
        <div className='admin-taxonomy-panel'>
            <div className='admin-taxonomy-panel-copy'>
                <h3 className='admin-taxonomy-panel-title'>建立分類</h3>
                <p className='admin-taxonomy-panel-subtitle'>使用表格建立商品分類。</p>
            </div>
            <form onSubmit={saveCategory} className='admin-taxonomy-form'>
                <div className='admin-taxonomy-field'>
                    <label className='admin-taxonomy-label'>分類名稱</label>
                    <input
                        type="text"
                        placeholder="分類名稱"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className='admin-taxonomy-input'
                    />
                </div>
                <button
                    type="submit"
                    className='admin-taxonomy-button'
                >
                    儲存分類
                </button>
            </form>
        </div>
    </>
  )
}

export default CreateCategory
