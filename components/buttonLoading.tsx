export default function ButtonLoading({name}: {name: string}) {
    return(
        <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            <span>{name}</span>
        </div>
    )
}