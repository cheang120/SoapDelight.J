import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { createBrand, getBrands, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';
import { toast } from 'react-toastify';

const CreateBrand = ({reloadBrands}) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");

    const { isLoading, categories = [] } = useSelector((state) => state.category || {});
    const dispatch = useDispatch();
    const isSuccess = useSelector((state) => state.category.isSuccess);
    const message = useSelector((state) => state.category.message);

    useEffect(() => {
      dispatch(getCategories());
    //   dispatch(getBrands());
    }, [dispatch]);

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    };

    

    const saveBrand = async (e) => {
        e.preventDefault();
        // console.log(name,category);
        
        if (name.length < 3) {
          return toast.error("Brand must be up to 3 characters");
        }
        if (!category) {
            return toast.error("Please add a parent category");
          }
          const slug = generateSlug(name);
          const formData = {
            name,
            slug,
            category,
          };

        //   try {
        //     await dispatch(createBrand(formData)).unwrap(); // unwrap 以捕獲錯誤
        //     setName("");
        //     setCategory(""); // 清除選擇
        //     reloadBrands(); // 重新加載品牌
        //     toast.success("Brand created successfully!");
        //     } catch (error) {
        //         toast.error(`Failed to create brand: ${error.message}`);
        // }



        // console.log(formData);
        await dispatch(createBrand(formData));
        await dispatch(getBrands());
        setName("");
        reloadBrands();
        
      };
  return (
    <>
    <div className='admin-taxonomy-panel'>
        <div className='admin-taxonomy-panel-copy'>
            <h3 className='admin-taxonomy-panel-title'>Create Brand</h3>
            <p className='admin-taxonomy-panel-subtitle'>Use the form to create a brand.</p>
        </div>
        <form onSubmit={saveBrand} className='admin-taxonomy-form'>
            <div className='admin-taxonomy-field'>
                <label className='admin-taxonomy-label'>Brand Name</label>
                <input
                    type="text"
                    placeholder="Brand name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className='admin-taxonomy-input'
                />
            </div>
            <div className='admin-taxonomy-field'>
                <label className='admin-taxonomy-label'>Parent Category</label>
                <select
                    name="category"
                    className='admin-taxonomy-input admin-taxonomy-select'
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="" className="dark:bg-gray-900 dark:text-white">Select category</option>
                    {categories.length > 0 && categories.map((cat) => (
                        <option key={cat._id} value={cat._name} className="dark:bg-gray-900 dark:text-white">
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>
            <button
                type="submit"
                className='admin-taxonomy-button'
            >
                Save Brand
            </button>
        </form>
    </div>
</>
  )
}

export default CreateBrand
