import { withForm } from "@/hooks/form"

interface image {
  imageId: string,
  isHidden: boolean,
  imageOrder: number
  imagUrl: number
}

type PropsType = {
  images?: string
}


const form = withForm({
  render: function Render({ form }) {
    const images = form.getFieldValue("images")
    if (images)
      return (
        <div>

        </div>
      )
    else
      return (<div>
        {}
        <div className="px-4 pb-4">
          <label className="block w-full cursor-pointer rounded-xl bg-violet-200/60 text-violet-900 py-3 text-center">
            Ajouter plus de photos
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
            />
          </label>
        </div>
      </div>)
  }

})
