import { LightningElement, track } from 'lwc';
import LogoImage from '@salesforce/resourceUrl/LogoImage';
import retriveChildObject from '@salesforce/apex/SourceMappingController2.retriveChildObject';
import getSourceDataList from '@salesforce/apex/SourceMappingController2.getSourceDataList';
import getObjectFieldsWrapper from '@salesforce/apex/SourceMappingController2.getObjectFieldsWrapper';
import retrieveBigTableFields from '@salesforce/apex/SourceMappingController2.retrieveBigTableFields';
import getDSMappingWrapper from '@salesforce/apex/SourceMappingController2.getDSMappingWrapper';

export default class MappingPageInLwc extends LightningElement {
    enrollmentRxLogo = LogoImage;
    @track objValue = 'CONTACT';
    @track selectedField = '';
    @track parentObjSelectedField = '';
    @track fieldsList = [];
    @track dataSourceOptions = [];
    @track checkBoxVal = true;
    @track wrapComboWithDeleteList = [];
    @track wrapComboWithDeleteList2 = [];
    @track bigTableFields = [];
    @track bigTableOptionList = [];
    @track bigTableSortedFields = [];
    @track showBTFields = false;
    @track showBTFieldsInChild = false;
    @track newIndex;
    @track newChildIndex;
    @track parentIndex;
    @track dmrParentIndex;
    @track parentObject = 'Contact';
    @track relatedObjectsList = [];
    @track showParentDetail = false;
    @track dmrObjName;
    @track showDMRModel = false;
    @track duplicateMatchRuleDataList = [];
    @track duplicateMatchRuleDataList2 = [];
    @track selectedDataSorce;
    @track optionsList = [];
    @track saveMappingData = [];
    @track childObjectsList = [];
    @track objWithFieldMappingList = [];

    get operatorTypeList() {
        return [
                { label: 'equals', value: 'equals'},
                { label: 'not equals', value: 'not equals'},
                { label: 'starts with', value: 'starts with'},
                { label: 'contains', value: 'contains'},
                { label: 'does not contain', value: 'does not contain'},
                { label: 'includes', value: 'includes'},
                { label: 'excludes', value: 'excludes'},
                { label: 'Street Address Match', value: 'Street Address Match'},
                { label: 'First N Characters', value: 'First N Characters'},
                { label: 'First Name Match', value: 'First Name Match'}
        ];
    }

    get filterTypeList() {
        return [
            { label: 'Static Value', value: 'Static Value'},
            { label: 'Big Table Field', value: 'Big Table Field'}
        ];
    }

    connectedCallback(){
        var options = [];
           
            getSourceDataList().then(dataSource => {
                dataSource.forEach(element => {
                    var option = {label : element, value : element};
                    options.push(option);
                });
                this.dataSourceOptions = options;
                if(options.length > 0)
                    this.selectedDataSorce = options[0].value;
                
                if(this.selectedDataSorce !== null){
                    this.initiateSaveMapping(this.selectedDataSorce);
                }
                
                // eslint-disable-next-line no-console
                console.log('dataSourceOptions !!@@ '+this.selectedDataSorce);
                })
                .catch(error => {
                // eslint-disable-next-line no-console
                console.log('Error !!@@ '+error);
            });
        //});

        retrieveBigTableFields().then(result => {
                var btFields = [];
                var btOptionList = [];
                result.forEach(element => {
                    var field = element.split(",");
                    var fieldObj = {label : field[1], APIName : field[0], index : btFields.length};
                    var option = {label : field[1], value : field[0]};
                    btOptionList.push(option);
                    btFields.push(fieldObj);
            });
            this.bigTableOptionList = btOptionList;
            this.bigTableFields = btFields;
            this.bigTableSortedFields = btFields;
        }).catch(error =>{
            // eslint-disable-next-line no-console
            console.log('Error In Big Table !!@@ '+JSON.stringify(error));
        });
    }

    initiateSaveMapping(selectedDataSource){
        this.wrapComboWithDeleteList = [];
        this.childObjectsList = [];
        this.relatedObjectsList = [];
        getDSMappingWrapper({SourceName : selectedDataSource}).then(result =>{
            var fieldOptionList = [];
            var wrapObj;
            var reqObjOption = [];
            var objOption = [];
            var childObjects = [];
            var objectsfieldsList = [];


            // eslint-disable-next-line no-console
            console.log('!!!!!!----result ---!!@@ '+JSON.stringify(result));

            result.forEach(datSourceObj =>{
                objOption = [];
                    datSourceObj.wrapObjFieldsList.forEach(objField =>{
                        let option = { 'label': objField.fieldLabel, 'value': objField.fieldName};
                        objOption.push(option);
                    });
                objectsfieldsList.push(objOption);
            });


            result[0].fieldMappingList.forEach(element =>{
                let isRequired = false;
                wrapObj = {selectedVal : element.selectedField, bTFieldName : element.btFieldName, index : fieldOptionList.length, isLast : false};
                result[0].wrapObjFieldsList.forEach(element2 =>{
                    if(element.selectedField === element2.fieldName){
                        isRequired = element2.isRequired;
                        if(element2.isRequired === true){
                            let option = { 'label': element2.fieldLabel, 'value': element2.fieldName};
                            reqObjOption.push(option);
                        }
                    }
                });
                wrapObj.isRequired = isRequired;
                wrapObj.optionList = (wrapObj.isRequired === true ? reqObjOption : objectsfieldsList[0]);
                fieldOptionList.push(wrapObj);
            });
            const wrapLastObj = {optionList : objectsfieldsList[0], selectedVal : '', bTFieldName : '', index : fieldOptionList.length, isLast : true, isRequired : false};
            fieldOptionList.push(wrapLastObj);
            this.wrapComboWithDeleteList = fieldOptionList;

            // For Child Objects of a object
            result.forEach(object =>{
                childObjects = [];
                object.childObjects.forEach(obj =>{
                        let option = {'label': obj.objLabel, 'value': obj.objName};
                        childObjects.push(option);
                });
                
                let objToChildObjList = {objName : object.objectName, childObjectList : childObjects, index : this.childObjectsList.length};
                if(result.length > this.childObjectsList.length + 1){
                    objToChildObjList.fieldMappingList = result[this.childObjectsList.length + 1].fieldMappingList;
                    objToChildObjList.selChildObj = result[this.childObjectsList.length + 1].selChildObjName;
                    objToChildObjList.parentOption = [];
                    let objFieldsList = []; 

                   result.forEach(object2 =>{
                        if(object.relatedTo === object2.objectName){
                            object2.childObjects.forEach(element =>{
                                if(element.objName === object.objectName){
                                    objToChildObjList.parentObjLabel = element.objLabel;
                                   // objToChildObjList.childObjectList = object2.childObjects;
                                }
                                if(object.relatedTo === element.objName){
                                    let options = [];
                                    let option = {label : element.objLabel, value : element.objName};
                                    options.push(option);
                                    objToChildObjList.parentOption = options;
                                }
                            });
                        }
                   });

                   if(result[this.childObjectsList.length + 1].wrapObjFieldsList.length > 0){  
                        result[this.childObjectsList.length + 1].wrapObjFieldsList.forEach(fieldObj2 =>{
                            const fieldOption = {label : fieldObj2.fieldLabel, value : fieldObj2.fieldName};
                            objFieldsList.push(fieldOption);
                        });
                    }
                    //if(objToChildObjList.objFieldsList.length > 0)
                            objToChildObjList.objFieldsList = objFieldsList;
                }else{
                    objToChildObjList.fieldMappingList = [];
                    objToChildObjList.selChildObj = '';
                    objToChildObjList.objFieldsList = [];
                }
                this.childObjectsList.push(objToChildObjList);
            });


                // eslint-disable-next-line no-console
                console.log('#########!!@@ '+JSON.stringify(this.childObjectsList));



            this.childObjectsList.forEach(obj2 =>{

                //const relatedObj = {childObjName : obj2.parentObjLabel, childObjList : obj2.childObjectList, selectedVal : obj2.selChildObj, selectedObjLabel : '', index : this.relatedObjectsList.length, showChild : false, showChildDetail : false, wrapSearchWithDeleteList : [], parentOption :obj2.parentOption, selectedParentVal : obj2.parentOption[0].value};
                const relatedObj = {childObjName : obj2.parentObjLabel, childObjList : obj2.childObjectList, selectedVal : obj2.selChildObj, selectedObjLabel : '', index : this.relatedObjectsList.length, showChild : false, showChildDetail : false, wrapSearchWithDeleteList : []};
                   let index = (this.relatedObjectsList.length > 0 ? (this.relatedObjectsList.length - 1) : 0);
                   
                   let selectedObjLabel; 
                  
                   this.childObjectsList[index].childObjectList.forEach(element =>{
                    if(element.value === obj2.objName){
                        relatedObj.childObjName = element.label;
                        selectedObjLabel = element.label;
                    }
                    // eslint-disable-next-line no-console
                    console.log('selectedObjLabel !!@@ '+selectedObjLabel);
                });
                if(this.relatedObjectsList.length > index){
                    // eslint-disable-next-line no-console
                    console.log('this.relatedObjectsList length !!@@ '+this.relatedObjectsList.length);
                    this.relatedObjectsList[index].selectedObjLabel = selectedObjLabel;
                }
                this.relatedObjectsList.push(relatedObj);
                 // eslint-disable-next-line no-console
                 console.log('relatedObj.selectedObjLabel !!@@ '+JSON.stringify(this.relatedObjectsList));
            }); 

            if(this.childObjectsList.length > 0){
                let indx = 0;
                this.childObjectsList.forEach(obj =>{
                    let optionList = obj.objFieldsList;
                    let childObjList = [];
                    
                    if(obj.fieldMappingList.length > 0){
                        obj.fieldMappingList.forEach(fMObj =>{
                            const childObj = {optionList : optionList, selectedVal : fMObj.selectedField, bTFieldName : fMObj.btFieldName, index : childObjList.length, showBtList : false, isLast : false };
                            childObjList.push(childObj);
                        });
                        const childObj = {optionList : optionList, selectedVal : '', bTFieldName : '', index : childObjList.length, showBtList : false, isLast : true };
                        childObjList.push(childObj);
                        this.relatedObjectsList[indx].wrapSearchWithDeleteList = childObjList;  
                    }
                    indx++;
                });
            }
        }).catch(error =>{
                // eslint-disable-next-line no-console
                console.log('Error In getDSMappingWrapper !!@@ '+JSON.stringify(error));
        });
    }
    

    getObjChildObjectList(objName, objLabel){
        var childObjectsList = [];
            retriveChildObject({objName : objName}).then(result =>{
                result.forEach(element =>{
                    const obj = {'label' : element.objLabel, 'value' : element.objName};
                    childObjectsList.push(obj);
                });
                if(childObjectsList.length > 0){
                    const relatedObj = {childObjName : objLabel, childObjList : childObjectsList, selectedVal : '', selectedObjLabel : '', index : this.relatedObjectsList.length, showChild : false, showChildDetail : false, wrapSearchWithDeleteList : []};
                    this.relatedObjectsList.push(relatedObj);
                }
            }).catch(error =>{
                // eslint-disable-next-line no-console
                console.log('!!@@ '+JSON.stringify(error));
        });
    }
    getSelectedDataSorce(event){
        var selectedDataSorce = event.target.value;
        this.initiateSaveMapping(selectedDataSorce);
        // eslint-disable-next-line no-console
        //console.log('selectedDataSorce !!@@ '+selectedDataSorce);

        getDSMappingWrapper({SourceName : selectedDataSorce}).then(result =>{
            // eslint-disable-next-line no-console
            console.log('result !! '+JSON.stringify(result));
        }).catch(error =>{
            // eslint-disable-next-line no-console
            console.log('result !! '+JSON.stringify(error));
        });
    }
       

    handleViewDetail(event){
        // eslint-disable-next-line no-console
        console.log('Retrived data !!@@ '+JSON.stringify(event.target.dataset));
    }

    getSelectedField(event){
        const targetedIndex = event.target.name;
        this.wrapComboWithDeleteList[targetedIndex].selectedVal = event.target.value;
        // eslint-disable-next-line no-console
        console.log('Selected Field == '+event.target.value);
    }
    getSelectedFieldInChild(event){
        const targetedIndex = event.target.dataset.index;
        const relatedObjListIndex = event.target.dataset.parentindex;
        this.relatedObjectsList[relatedObjListIndex].wrapSearchWithDeleteList[targetedIndex].selectedVal = event.target.value;
    }
    getCheckboxValue(){
        this.checkBoxVal = !(this.checkBoxVal);
        // eslint-disable-next-line no-console
        console.log('this.checkBoxVal !!@@ '+this.checkBoxVal);
    }
    handleDeleteInDMR(event){
        var dmrDataSet = event.target.dataset; 
        
        if(this.duplicateMatchRuleDataList.length > 0){
            let index = this.duplicateMatchRuleDataList.findIndex(element => element.objName === dmrDataSet.objname);
            
            // eslint-disable-next-line no-console
            console.log('index !!@@ '+index);

            this.duplicateMatchRuleDataList[index].dataList.splice(index,1);

            if(this.duplicateMatchRuleDataList[index].dataList.length > 0){
                this.duplicateMatchRuleDataList[index].dataList.forEach(element =>{
                    if(element.index > index)
                        element.index = element.index - 1;      
                        element.srNo = element.srNo - 1;
                });  
            }
            
            // eslint-disable-next-line no-console
            console.log('List 2 Size !!@@@ '+this.duplicateMatchRuleDataList2.length);
       }
    }
    handleDelete(event){
        var startIndex = event.target.dataset.index;
        // eslint-disable-next-line no-console
        console.log('startIndex !!@@ '+startIndex);

        const objToRemove = this.wrapComboWithDeleteList[startIndex];

        if(objToRemove.isLast === false){
            this.wrapComboWithDeleteList.splice(startIndex,1);
        }
        this.wrapComboWithDeleteList.forEach(element =>{
            if(element.index > startIndex){
                element.index = element.index - 1;
            }
        });
    }
    handleDeleteInChild(event){
        var childIndex = event.target.dataset.index;
        var parentIndex = event.target.dataset.parentindex;
        var objToRemove = this.relatedObjectsList[parentIndex].wrapSearchWithDeleteList[childIndex];
        if(objToRemove.isLast === false){
            this.relatedObjectsList[parentIndex].wrapSearchWithDeleteList.splice(childIndex,1);
        }
        this.relatedObjectsList[parentIndex].wrapSearchWithDeleteList.forEach(element =>{
            if(element.index > childIndex){
                element.index = element.index - 1;
            }
        });
    }
    handleSearch(event){
        this.showBTFields = true;
        this.newIndex = event.target.dataset.index;
    }
    handleSearchInChild(event){
        this.showBTFieldsInChild = true;
        this.newChildIndex = event.target.dataset.index;
        this.parentIndex = event.target.dataset.parentindex;
        this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList[this.newChildIndex].showBtList = true;
    }
    getSelectedBTField(event){
        this.showBTFields = false;
        this.bigTableSortedFields = this.bigTableFields;
        const selectedItemIndex = event.target.dataset.index;
        this.wrapComboWithDeleteList[this.newIndex].bTFieldName = this.bigTableFields[selectedItemIndex].APIName;
        this.wrapComboWithDeleteList[this.newIndex].isLast = false;
        let options = this.wrapComboWithDeleteList[this.newIndex].optionList;
        
        const newObj = {optionList : options, selectedVal : '', bTFieldName : '', index : this.wrapComboWithDeleteList.length, isLast : true, isRequired : false};
        this.wrapComboWithDeleteList.push(newObj);
    }
    getSelectedBTFieldInChilds(event){
       
        this.showBTFieldsInChild = false;
        this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList[this.newChildIndex].showBtList = false;
        this.bigTableSortedFields = this.bigTableFields;

        this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList[this.newChildIndex].bTFieldName = this.bigTableFields[event.target.dataset.index].APIName;
        this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList[this.newChildIndex].isLast = false;
        let options = this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList[this.newChildIndex].optionList;
        let childObjIndex = this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList.length;
        
        let childObj = {optionList : options, selectedVal : '', bTFieldName : '', index : childObjIndex, showBtList : false, isLast : true };
        this.relatedObjectsList[this.parentIndex].wrapSearchWithDeleteList.push(childObj);
    }
    handleSearchChange(event){
        var searchBoxValue = event.target.value;
        var btFieldsList = this.bigTableFields;
        var sortedBTFields = [];

        btFieldsList.forEach(function(obj){
            if(obj.label.startsWith(searchBoxValue)){
                sortedBTFields.push(obj);
            }   
        });
        this.bigTableSortedFields = sortedBTFields;
    }
    handleChildObjSelect(event){
        var index = event.target.dataset.index;
        var selectedValue = event.target.value;
        var dropDownOptionList = this.relatedObjectsList[index].childObjList;
        this.relatedObjectsList[index].selectedVal = selectedValue;  
        dropDownOptionList.forEach(element =>{
            if(element.value === selectedValue){
                this.relatedObjectsList[index].selectedObjLabel = element.label;
            }
        });
    }
    handleParentHideShow(){
        this.showParentDetail = !this.showParentDetail;
        // eslint-disable-next-line no-console
        console.log('showParentDetail !!@@ '+this.showParentDetail);
    }
    handleChildsHideShow(event){
        var index = event.target.dataset.index;
        // eslint-disable-next-line no-console
        console.log('Title In Child !!@@ '+index);
        this.relatedObjectsList[index].showChildDetail = !this.relatedObjectsList[index].showChildDetail;
    }
   
    handleFilterChange(event){
        var targetedDataSet = event.target.dataset;
        if(event.target.value === 'Big Table Field'){
            this.duplicateMatchRuleDataList[targetedDataSet.index].isStaticFilter = false;
        }else{
            this.duplicateMatchRuleDataList[targetedDataSet.index].isStaticFilter = true;
        }
        
       // eslint-disable-next-line no-console
       console.log(JSON.stringify(targetedDataSet));
    }
    handleDMRSave(){
        var obj = this.duplicateMatchRuleDataList[0];
        if(this.duplicateMatchRuleDataList2.length > 0){
                let index = this.duplicateMatchRuleDataList2.findIndex(element => element.objName === obj.objName);
                // eslint-disable-next-line no-console
                console.log('!!!@@@@@ '+index);
                if(index < 0){
                    this.duplicateMatchRuleDataList2.push(obj);
                }else{
                    this.duplicateMatchRuleDataList2[index] = obj;
                }
        }else{
            this.duplicateMatchRuleDataList2.push(this.duplicateMatchRuleDataList[0]);
            // eslint-disable-next-line no-console
            console.log('Size Of DMR List 2 --- '+this.duplicateMatchRuleDataList2.length);
        }
        
    }
    handleDuplicateMatchingRule(event){
        var dmrDataList = [];
        var dataList;
        var dataList2 = [];
        var dmrObj;
        var dataSet = event.target.dataset;
        this.dmrObjName = dataSet.objname;
        const parentIndex = dataSet.index;

        const pIndex  = parseInt(parentIndex, 10) + 1;
        this.dmrParentIndex = (parentIndex === undefined ? 0 : pIndex);
        this.showDMRModel = true;
        // eslint-disable-next-line no-console
        console.log('--282 dataset --'+JSON.stringify(dataSet));

        //this.dmrParentIndex = dataSet.index;
        
        dataList = (this.dmrObjName.toLowerCase() === 'contact' ? this.wrapComboWithDeleteList : this.relatedObjectsList[parentIndex].wrapSearchWithDeleteList);
        
        dataList.forEach(element =>{
                const obj = {objFieldList : element.optionList, srNo : (dmrDataList.length + 1), selectedVal : element.selectedVal, operatorList : this.operatorTypeList, operatorSelVal : 'equals', filterList : this.filterTypeList, filterSelVal: 'Static Value', btFieldsOptionList : this.bigTableOptionList, btSelectedVal : '', staticInputVal : '', index : dmrDataList.length, isStaticFilter : true};
                dmrDataList.push(obj);
        });
        dmrObj = {objName : dataSet.objname, dataList : dmrDataList};
        dataList2.push(dmrObj);
        this.duplicateMatchRuleDataList = dataList2;
    }
    hideDMRModel(){
        this.showDMRModel = false;
    }
    handleDMRCancel(){
        /*var dmrDataList = [];
        var dataList;
        var dataList2 = [];
        var dmrObj;
        dataList = (this.dmrObjName.toLowerCase() === 'contact' ? this.wrapComboWithDeleteList : this.relatedObjectsList[this.dmrParentIndex].wrapSearchWithDeleteList);
        
        dataList.forEach(element =>{
                const obj = {objFieldList : element.optionList, srNo : (dmrDataList.length + 1), selectedVal : element.selectedVal, operatorList : this.operatorTypeList, operatorSelVal : 'equals', filterList : this.filterTypeList, filterSelVal: 'Static Value', btFieldsOptionList : this.bigTableOptionList, btSelectedVal : '', staticInputVal : '', index : dmrDataList.length, isStaticFilter : true};
                dmrDataList.push(obj);
        });
        dmrObj = {objName : this.dmrObjName, dataList : dmrDataList};
        dataList2.push(dmrObj);
        this.duplicateMatchRuleDataList = dataList2;
        this.duplicateMatchRuleDataList2.push(dmrObj);*/
    }

    handleChildHideShow(event){
        const childIndex = event.target.dataset.index;
        this.relatedObjectsList[childIndex].showChild = !this.relatedObjectsList[childIndex].showChild;
    }
    handleObjFieldChange(event){
        // eslint-disable-next-line no-console
        console.log('OBJ Field !!@@ '+event.target.value);
    }
    handleOperatorChange(event){
        // eslint-disable-next-line no-console
        console.log('OperatorChange !!@@@ '+event.target.value);
    }
    handleBTFieldChange(event){
        // eslint-disable-next-line no-console
        console.log('BTFieldChange !!@@@ '+event.target.value);
    }
    addRelatedObjects(event){
        let btnIndex = event.target.dataset.index;
        var objName = this.relatedObjectsList[btnIndex].selectedVal;
        var objLabel = this.relatedObjectsList[btnIndex].selectedObjLabel;
        var ObjFields = [];
        this.getObjChildObjectList(objName, objLabel);  

        // eslint-disable-next-line no-console
        console.log('objName !!!@@ '+objName);
        

        // eslint-disable-next-line no-console
        console.log('btnIndex : '+btnIndex);

        getObjectFieldsWrapper({objName : objName}).then(result =>{
            result.forEach(function(element) {
                    const obj = { 'label': element.fieldLabel, 'value': element.fieldName };
                    ObjFields.push(obj);
                });

                this.fieldsList = ObjFields;
				const childObjList = [];
                const childObj = {optionList : ObjFields, selectedVal : '', bTFieldName : '', index : 0, showBtList : false, isLast : true };
                childObjList.push(childObj);
                this.relatedObjectsList[btnIndex].wrapSearchWithDeleteList = childObjList;
        }).catch(error =>{
                // eslint-disable-next-line no-console
                console.log('ObjName !!@@ '+error);
        });
    }
}