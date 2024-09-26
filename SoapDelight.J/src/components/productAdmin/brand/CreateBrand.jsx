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
    <div className='--mb2 pt-5'>
        <h3 className='text-2xl pb-5'>Create Brand</h3>
        <p className='mb-5'>
            Use the form to <b>Create a Brand.</b>
        </p>
        <div className="max-w-md bg-white dark:bg-gray-800 p-8 shadow-lg rounded-lg">
            <form onSubmit={saveBrand}>
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                        Brand Name:
                    </label>
                    <input
                        type="text"
                        placeholder="Brand name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                    <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 mt-4">
                        Parent Category:
                    </label>
                    <select
                        name="category"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
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
                <div className="mt-6">
                    <button
                        type="submit"
                        className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-300 dark:bg-pink-600 dark:hover:bg-pink-700"
                    >
                        Save Brand
                    </button>
                </div>
            </form>
        </div>


    </div>
</>
  )
}

export default CreateBrand
