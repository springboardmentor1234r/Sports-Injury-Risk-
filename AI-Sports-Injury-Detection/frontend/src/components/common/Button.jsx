function Button({
    children,
    onClick,
    type="button"
}){
    return(
        <button 
            type={type}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

export default  Button;