package vmcTest.tests

import org.junit.Test
import vmcTest.pages.*
import geb.Page.*

class AdminDrTest extends TestBase {
    // called before each test
    def setup() {
        int count = 0
        while(count<numberOfTrials) {
            count ++
            try {
                setup: 'Open VMC page'
                to VoltDBManagementCenterPage
                expect: 'to be on VMC page'
                at VoltDBManagementCenterPage

                when: 'click the Admin link (if needed)'
                page.openAdminPage()
                then: 'should be on Admin page'
                at AdminPage

                break
            } catch (org.openqa.selenium.ElementNotVisibleException e) {
                println("ElementNotVisibleException: Unable to Start the test")
                println("Retrying")
            }
        }
    }

    def "Check all the titles and labels in Database Replication (DR) section"(){
        boolean result = page.CheckIfDREnabled();
        expect: "Database Replication (DR) titles and labels are displayed"
        if(result){
            waitFor(waitTime){page.DrTitle.isDisplayed()}
            waitFor(waitTime){page.DrTitle.text().toLowerCase().equals("Database Replication (DR)".toLowerCase())}
            println("Database Replication (DR) is displayed")

            waitFor(waitTime){page.drId.isDisplayed()}
            waitFor(waitTime){page.drId.text().toLowerCase().equals("ID".toLowerCase())}
            println("Label, Id is displayed")

            waitFor(30){page.master.isDisplayed()}
            waitFor(30){page.master.text().toLowerCase().equals("Master".toLowerCase())}
            println("Label, master is displayed")

            waitFor(30){page.drTables.isDisplayed()}
            waitFor(30){page.drTables.text().toLowerCase().equals("DR Tables".toLowerCase())}
            println("Label, DR Tables is displayed")
        } else{
            println("DR is not enabled. DR should be enable to check all the titles and labels in Database Replication (DR) section.")
        }
    }

    def "Check value of DR Id"() {
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            waitFor(waitTime){
                page.drIdValue.isDisplayed()
                !page.drIdValue.text().equals("")
            }
        }else{
            println("DR is not enabled. DR should be enable to check value of DR Id.")
        }
    }

    def "Check DR master value"() {
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            waitFor(waitTime){
                page.masterValue.isDisplayed()
                !page.masterValue.text().equals("")
            }
        }else{
            println("DR is not enabled. DR should be enable to check DR master value")
        }
    }

    def "Check DR replica label is displayed"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            waitFor(waitTime) {
                page.replica.isDisplayed()
                !page.replica.text().equals("")
            }
        } else {
            println("DR is not enabled.  DR should be enable to check DR replica label is displayed")
        }
    }

    def "Check if replica source is defined in case of Replica"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled()
        if(result){
            waitFor(waitTime){page.drMode.isDisplayed()}
            if(drMode.text().toLowerCase() == "replica" || drMode.text().toLowerCase() == "both"){
                waitFor(waitTime){
                    page.replicSource.isDisplayed()
                    !page.replicSource.text().equals("")
                }
            } else {
                waitFor(waitTime){page.replicSource.isDisplayed()}
            }
        } else {
            println("DR is not enabled. DR should be enable to check if replica source is defined in case of Replica")
        }
    }

    def "Check if replica value is off for master and on for replica"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            if(drMode.text().toLowerCase() == "replica" || drMode.text().toLowerCase() == "both"){
                if(replicaSourceValue.text().toLowerCase() == "on"){
                    println("Replica value is on when DR mode is either replica or both")
                } else {
                    assert false
                }
            }else if(drMode.text().toLowerCase() == "master"){
                if(replicaSourceValue.text().toLowerCase() == "off"){
                    println("Replica value is off when DR mode is master")
                } else {
                    assert false
                }
            }
        } else {
            println("DR is not enabled. DR should be enable to check if replica value is off for master and on for replica")
        }
    }

    def "Check DR replica source value"() {
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            waitFor(waitTime){
                page.replicaSourceValue.isDisplayed()
                !page.replicaSourceValue.text().equals("")
            }
        }else{
            println("DR is not enabled. DR should be enable to check DR replica source value.")
        }
    }

    def "Click DR Tables button and check whether DR table list get display or not and then click Ok"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            try{
                page.btnListDrTables.isDisplayed()
                page.btnListDrTables.click()
                page.drTablePopup.isDisplayed()
                println("DR table popup is displayed")
                page.drTableListOk.isDisplayed()
                page.drTableListOk.click()
                page.btnListDrTables.isDisplayed()
                println("DR table popup is closed and DR table button is displayed")
            }catch(geb.waiting.WaitTimeoutException e){
                println("DR tables list cannot be displayed")
            }
            catch(org.openqa.selenium.ElementNotVisibleException e){
                println("DR tables list cannot be displayed")
            }
        } else {
            println("DR is not enabled. DR should be enable to check DR table button.")
        }
    }

    def "Check if DR mode is present "(){
        expect: "DR mode is present and is either Master or Replica or Both"
        boolean result = page.CheckIfDREnabled();
        if(result){
            waitFor(waitTime){ page.drMode.isDisplayed() }
            if(page.drMode.text().toLowerCase() == 'replica' || page.drMode.text().toLowerCase() == 'master' || page.drMode.text().toLowerCase() == 'both'){
                println("DR mode is displayed properly");
            } else{
                assert false;
            }
        }else{
            println("DR is not enabled. DR should be enable to check if DR mode is present.")
        }
    }

    def "Check whether Ok and cancel button are displayed when Master Edit button is clicked"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            try {
                page.drMasterEdit.isDisplayed()
                page.drMasterEdit.click()
                page.btnEditDrMasterOk.isDisplayed()
                page.btnEditDrMasterCancel.isDisplayed()
                println("Ok and cancel button are displayed when Master Edit button is clicked")
            }
            catch(geb.waiting.WaitTimeoutException e){
                println("Master Edit cannot be displayed")
            }
            catch(org.openqa.selenium.ElementNotVisibleException e)
            {
                println("Master Edit cannot be displayed")
            }
        } else {
            println("DR is not enabled. DR should be enable to check master edit.")
        }
    }

    def "Check cancel edit button for master edit.Click Master edit button and then cancel"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            try {
                page.drMasterEdit.click()
                page.btnEditDrMasterOk.isDisplayed()
                page.btnEditDrMasterCancel.isDisplayed()
                page.btnEditDrMasterCancel.click()
                println("security edit canceled!")
                page.drMasterEdit.isDisplayed()
            }
            catch(geb.waiting.WaitTimeoutException e){
                println("Master Edit cannot be displayed")
            }
            catch(org.openqa.selenium.ElementNotVisibleException e)
            {
                println("Master Edit cannot be displayed")
            }
        } else {
            println("DR is not enabled. DR should be enable to check master edit.")
        }
    }

    def "Check cancel button on edit master popup. Click Master edit button and then cancel button on popup"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            try {
                page.drMasterEdit.click()
                page.btnEditDrMasterOk.isDisplayed()
                page.btnEditDrMasterCancel.isDisplayed()
                page.btnEditDrMasterOk.click()
                println("master edit ok clicked!")
                waitFor(waitTime) {
                    page.btnSaveDrMaster.isDisplayed()
                    page.btnPopupDrMasterCancel.isDisplayed()
                    page.btnPopupDrMasterCancel.click()
                    println("cancel clicked")
                    page.drMasterEdit.isDisplayed()
                }
            }
            catch(geb.waiting.WaitTimeoutException e){
                println("Master Edit cannot be displayed")
            }
            catch(org.openqa.selenium.ElementNotVisibleException e)
            {
                println("Master Edit cannot be displayed")
            }
        } else {
            println("DR is not enabled. DR should be enable to check master edit.")
        }
    }

    def "Check ok button on edit master popup.Click master edit button and then ok button on popup"(){
        when:
        at AdminPage
        then:
        boolean result = page.CheckIfDREnabled();
        if(result){
            try {
                page.drMasterEdit.click()
                page.btnEditDrMasterOk.isDisplayed()
                page.btnEditDrMasterCancel.isDisplayed()
                page.btnEditDrMasterOk.click()
                println("master edit ok clicked!")
                waitFor(waitTime) {
                    page.btnSaveDrMaster.isDisplayed()
                    page.btnPopupDrMasterCancel.isDisplayed()
                    page.btnSaveDrMaster.click()
                    println("ok clicked")
                }
            }
            catch(geb.waiting.WaitTimeoutException e){
                println("Master Edit cannot be displayed")
            }
            catch(org.openqa.selenium.ElementNotVisibleException e)
            {
                println("Master Edit cannot be displayed")
            }
        } else {
            println("DR is not enabled. DR should be enable to check master edit.")
        }
    }
}