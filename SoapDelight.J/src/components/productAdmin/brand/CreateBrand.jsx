import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';

const CreateBrand = () => {
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

    

    const saveBrand = async (e) => {
        e.preventDefault();
        // console.log(name);
        if (name.length < 3) {
          return toast.error("Coupon must be up to 3 characters");
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
    <div className="--underline"></div>
    <br />
    <div className='--mb2'>
        <h3>Create Brand</h3>
        <p>
            Use the form to <b>Create a Brand.</b>
        </p>
        <div className="max-w-md  bg-white p-8 shadow-lg rounded-lg"> 
            <form onSubmit={saveBrand}>
                <div className="mb-4"> 
                    <label className="block text-gray-700 text-sm font-bold mb-2"> 
                        Brand Name:
                    </label>
                    <input
                        type="text"
                        placeholder="Brand name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <label className="block text-gray-700 text-sm font-bold mb-2 mt-4">Parent Category:</label>
                    <select
                        name="category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Select category</option>
                        {categories.length > 0 && categories.map((cat) => (
                            <option key={cat._id} value={cat._name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-6"> 
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"> 
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
