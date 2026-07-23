function Table({
    headers,
    children

}){
    return(
        <table>
            <thead>
                <tr>
                    {
                        headers.map((header)=>(
                            <th key={header}>
                                {header}
                            </th>
                        ))
                    }

                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    )
}
export default Table;